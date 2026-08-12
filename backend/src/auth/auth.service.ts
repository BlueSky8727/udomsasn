import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

/** ไม่ส่ง passwordHash และไม่ส่ง avatarPath ออกไป เพราะเป็น path จริงบนดิสก์ของเซิร์ฟเวอร์ */
type SafeUser = Omit<User, 'passwordHash' | 'avatarPath'> & { hasAvatar: boolean };

export type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type UpdateProfileInput = {
  name: string;
  phone: string;
};

/** อายุลิงก์และรหัสยืนยันอีเมล */
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/** กรอกรหัสผิดเกินจำนวนนี้ โทเคนใช้ไม่ได้อีก ต้องขอรหัสใหม่ — กันไล่เดารหัส 6 หลัก */
const MAX_CODE_ATTEMPTS = 5;

/** รหัสตั้งรหัสผ่านใหม่อายุสั้นกว่ารหัสยืนยันอีเมล เพราะถ้าหลุดคือยึดบัญชีได้ทันที */
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async login(email: string, password: string, requestedRole?: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    // ตอบข้อความจริงได้เฉพาะหลังจากรหัสผ่านถูกต้องแล้ว เพื่อไม่ให้ใช้หน้าล็อกอินไล่เดาว่ามีอีเมลนี้อยู่ไหม
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('ยังไม่ได้ยืนยันอีเมล กรุณากดลิงก์ยืนยันที่ส่งไปให้ก่อน');
    }
    if (user.accountStatus === 'PENDING') {
      throw new ForbiddenException('บัญชีรอหัวหน้าวิชาการอนุมัติ กรุณารอการติดต่อกลับ');
    }
    if (user.accountStatus !== 'ACTIVE') {
      throw new ForbiddenException('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
    }
    if (requestedRole && user.role !== requestedRole) {
      throw new UnauthorizedException('บัญชีนี้ไม่มีสิทธิ์ในตำแหน่งที่เลือก');
    }
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id, role: user.role }),
      user: this.safe(user),
    };
  }

  /**
   * สมัครสมาชิกใหม่
   *
   * ตำแหน่งเริ่มต้นเป็น TEACHER และสถานะเป็น PENDING เสมอ ห้ามให้ผู้สมัครเลือกเอง (กฎเหล็กข้อ 2)
   * หัวหน้าวิชาการเป็นผู้กำหนดตำแหน่งและเปิดใช้งานบัญชีผ่านหน้าจัดการผู้ใช้
   */
  async register(input: RegisterInput, avatarPath: string | null) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      // ไฟล์รูปถูกเขียนลงดิสก์ไปแล้วตอน multer รับคำขอ ต้องลบทิ้งเมื่อสมัครไม่สำเร็จ
      await this.removeFile(avatarPath);
      throw new BadRequestException('อีเมลนี้ถูกใช้สมัครแล้ว');
    }
    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          name: input.name.trim(),
          phone: input.phone.trim(),
          avatarPath,
          passwordHash: await bcrypt.hash(input.password, 12),
          role: 'TEACHER',
          accountStatus: 'PENDING',
        },
      });
    } catch (error) {
      await this.removeFile(avatarPath);
      throw error;
    }
    // ถ้าส่งอีเมลไม่ผ่าน ห้ามโยน error ทิ้ง เพราะบัญชีถูกสร้างไปแล้ว
    // ผู้สมัครจะสมัครซ้ำก็ไม่ได้ (อีเมลซ้ำ) และไม่รู้ว่าต้องทำอะไรต่อ
    // ให้บอกตามจริงว่าส่งไม่สำเร็จ แล้วให้กด "ส่งอีกครั้ง" แทน
    const emailSent = await this.issueVerification(user)
      .then(() => true)
      .catch(() => false);

    return {
      message: emailSent
        ? 'สมัครสมาชิกเรียบร้อย กรุณาตรวจอีเมลเพื่อยืนยันตัวตน'
        : 'สมัครสมาชิกเรียบร้อย แต่ส่งอีเมลยืนยันไม่สำเร็จ กรุณากดส่งอีเมลอีกครั้ง',
      email: user.email,
      emailSent,
    };
  }

  /**
   * ส่งลิงก์ยืนยันอีเมลใหม่
   *
   * ตอบข้อความเดียวกันเสมอไม่ว่าอีเมลจะมีอยู่จริงหรือไม่ เพื่อไม่ให้ใช้เป็นเครื่องมือไล่เดาอีเมลในระบบ
   */
  async resendVerification(email: string) {
    const message = 'ถ้าอีเมลนี้อยู่ในระบบและยังไม่ได้ยืนยัน ระบบได้ส่งลิงก์ยืนยันให้แล้ว';
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (user && !user.emailVerifiedAt) await this.issueVerification(user);
    return { message };
  }

  async verifyEmail(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const token = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!token || token.usedAt || token.expiresAt < new Date()) {
      throw new BadRequestException('ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่');
    }
    if (token.user.emailVerifiedAt) {
      return { message: 'อีเมลนี้ยืนยันเรียบร้อยแล้ว', alreadyVerified: true };
    }
    await this.markVerified(token.userId, token.id);
    return { message: 'ยืนยันอีเมลเรียบร้อย รอหัวหน้าวิชาการอนุมัติบัญชี', alreadyVerified: false };
  }

  /** ปิดงานยืนยันอีเมล: โทเคนใช้ได้ครั้งเดียว และล้างโทเคนที่ยังค้างของผู้ใช้คนนี้ทิ้งพร้อมกัน */
  private async markVerified(userId: string, tokenId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } }),
      this.prisma.emailVerificationToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.deleteMany({ where: { userId, usedAt: null } }),
    ]);
  }

  /**
   * ขอรหัสตั้งรหัสผ่านใหม่
   *
   * ตอบข้อความเดียวกันเสมอไม่ว่าอีเมลจะมีอยู่จริงหรือไม่
   * ไม่งั้นหน้า "ลืมรหัสผ่าน" จะกลายเป็นเครื่องมือไล่เช็คว่ามีใครใช้ระบบนี้บ้าง
   */
  async forgotPassword(email: string) {
    const message = 'ถ้าอีเมลนี้อยู่ในระบบ ระบบได้ส่งรหัสตั้งรหัสผ่านใหม่ให้แล้ว';
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    // บัญชีที่ถูกระงับไม่ควรตั้งรหัสผ่านใหม่เองได้ ต้องให้ผู้ดูแลปลดล็อกก่อน
    if (!user || user.accountStatus === 'DISABLED') return { message };

    const code = this.generateCode();
    await this.prisma.$transaction([
      // ขอรหัสใหม่แล้วรหัสเก่าต้องใช้ไม่ได้ทันที
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          codeHash: this.hashCode(code),
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      }),
    ]);
    await this.mail.sendPasswordResetEmail(user.email, user.name, code).catch(() => undefined);
    return { message };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const invalid = new BadRequestException('รหัสไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอรหัสใหม่');
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || user.accountStatus === 'DISABLED') throw invalid;

    const token = await this.prisma.passwordResetToken.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!token || token.expiresAt < new Date()) throw invalid;
    if (token.attempts >= MAX_CODE_ATTEMPTS) {
      throw new BadRequestException('กรอกรหัสผิดหลายครั้งเกินไป กรุณาขอรหัสใหม่');
    }
    if (!this.matchesCode(token.codeHash, code.trim())) {
      const attempts = token.attempts + 1;
      await this.prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { attempts },
      });
      const left = MAX_CODE_ATTEMPTS - attempts;
      throw new BadRequestException(
        left > 0 ? `รหัสไม่ถูกต้อง เหลือโอกาสอีก ${left} ครั้ง` : 'กรอกรหัสผิดหลายครั้งเกินไป กรุณาขอรหัสใหม่',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await bcrypt.hash(newPassword, 12),
          // กรอกรหัสจากอีเมลได้ = พิสูจน์แล้วว่าเป็นเจ้าของอีเมลจริง
          // ถ้าไม่ตั้งตรงนี้ คนที่ยังไม่ยืนยันอีเมลจะตั้งรหัสใหม่เสร็จแล้วก็ยังล็อกอินไม่ได้อยู่ดี
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    ]);
    return { message: 'ตั้งรหัสผ่านใหม่เรียบร้อย เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย' };
  }

  async avatarPathFor(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPath: true },
    });
    return user?.avatarPath ?? null;
  }

  private async issueVerification(user: User): Promise<void> {
    const rawToken = randomBytes(32).toString('base64url');
    const code = this.generateCode();
    // เก็บเฉพาะ hash ถ้าฐานข้อมูลรั่วก็เอาโทเคน/รหัสไปยืนยันแทนเจ้าของไม่ได้
    await this.prisma.$transaction([
      // ขอรหัสใหม่แล้วรหัสเก่าต้องใช้ไม่ได้ทันที ไม่งั้นรหัสเก่าที่หลุดไปยังใช้ได้อยู่
      this.prisma.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      this.prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(rawToken),
          codeHash: this.hashCode(code),
          expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
        },
      }),
    ]);
    const appUrl = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const link = `${appUrl}/verify-email?token=${rawToken}`;
    await this.mail.sendVerificationEmail(user.email, user.name, link, code);
  }

  /** รหัส 6 หลักแบบสุ่มปลอดภัย ไม่ใช้ Math.random เพราะเดาลำดับถัดไปได้ */
  private generateCode(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  /**
   * ยืนยันด้วยรหัส 6 หลักที่ผู้ใช้กรอกเอง
   *
   * ต้องคู่กับอีเมลเสมอ เพื่อไม่ให้ยิงรหัส 6 หลักมั่ว ๆ แล้วไปตรงกับของใครก็ได้ในระบบ
   */
  async verifyCode(email: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) throw new BadRequestException('รหัสยืนยันไม่ถูกต้องหรือหมดอายุแล้ว');
    if (user.emailVerifiedAt) {
      return { message: 'อีเมลนี้ยืนยันเรียบร้อยแล้ว', alreadyVerified: true };
    }

    const token = await this.prisma.emailVerificationToken.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!token || token.expiresAt < new Date()) {
      throw new BadRequestException('รหัสยืนยันหมดอายุแล้ว กรุณากดขอรหัสใหม่');
    }
    if (token.attempts >= MAX_CODE_ATTEMPTS) {
      throw new BadRequestException('กรอกรหัสผิดหลายครั้งเกินไป กรุณากดขอรหัสใหม่');
    }
    if (!this.matchesCode(token.codeHash, code.trim())) {
      const attempts = token.attempts + 1;
      await this.prisma.emailVerificationToken.update({
        where: { id: token.id },
        data: { attempts },
      });
      const left = MAX_CODE_ATTEMPTS - attempts;
      throw new BadRequestException(
        left > 0 ? `รหัสยืนยันไม่ถูกต้อง เหลือโอกาสอีก ${left} ครั้ง` : 'กรอกรหัสผิดหลายครั้งเกินไป กรุณากดขอรหัสใหม่',
      );
    }

    await this.markVerified(user.id, token.id);
    return { message: 'ยืนยันอีเมลเรียบร้อย รอหัวหน้าวิชาการอนุมัติบัญชี', alreadyVerified: false };
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  /** OTP มีพื้นที่ค้นหาเล็ก จึงต้องใช้ HMAC พร้อม secret ไม่ใช่ hash เปล่า */
  private hashCode(code: string): string {
    const secret = process.env.CODE_HASH_SECRET ?? process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('CODE_HASH_SECRET หรือ JWT_SECRET ต้องมีอย่างน้อย 32 ตัวอักษร');
    }
    return createHmac('sha256', secret).update(code).digest('hex');
  }

  /** รองรับโทเคนเก่าที่สร้างก่อนเปลี่ยนเป็น HMAC จนกว่าจะหมดอายุตาม TTL */
  private matchesCode(storedHash: string, code: string): boolean {
    const candidates = [this.hashCode(code), this.hashToken(code)];
    return candidates.some((candidate) => {
      const stored = Buffer.from(storedHash, 'hex');
      const expected = Buffer.from(candidate, 'hex');
      return stored.length === expected.length && timingSafeEqual(stored, expected);
    });
  }

  private async removeFile(path: string | null): Promise<void> {
    if (!path) return;
    await unlink(path).catch(() => undefined);
  }

  private safe(user: User): SafeUser {
    const { passwordHash: _passwordHash, avatarPath, ...safeUser } = user;
    return { ...safeUser, hasAvatar: Boolean(avatarPath) };
  }

  async me(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.accountStatus !== 'ACTIVE') throw new UnauthorizedException();
    return this.safe(user);
  }

  async updateProfile(
    id: string,
    input: UpdateProfileInput,
    avatarPath: string | null,
  ): Promise<SafeUser> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing || existing.accountStatus !== 'ACTIVE') throw new UnauthorizedException();

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: input.name.trim(),
        phone: input.phone.replace(/[^0-9]/g, ''),
        ...(avatarPath ? { avatarPath } : {}),
      },
    });

    if (avatarPath && existing.avatarPath && existing.avatarPath !== avatarPath) {
      await this.removeFile(existing.avatarPath);
    }
    return this.safe(user);
  }
}
