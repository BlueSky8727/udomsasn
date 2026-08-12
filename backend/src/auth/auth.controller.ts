import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import type { Request, Response } from 'express';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { existsSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { diskStorage } from 'multer';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RateLimitService } from './rate-limit.service';
import { removeStoredFiles, validateUploadedFiles } from '../media/upload-security';

const AVATAR_MIME_BY_EXTENSION: Record<string, readonly string[]> = {
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.webp': ['image/webp'],
};

export const AVATAR_DIR = () => resolve(process.env.UPLOAD_DIR ?? 'uploads', 'avatars');

const avatarUpload = {
  storage: diskStorage({
    destination: (
      _request: unknown,
      _file: Express.Multer.File,
      callback: (error: Error | null, destination: string) => void,
    ) => {
      const destination = AVATAR_DIR();
      mkdirSync(destination, { recursive: true });
      callback(null, destination);
    },
    filename: (_request, file, callback) =>
      callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { files: 1, fileSize: Number(process.env.MAX_AVATAR_BYTES ?? 2_097_152) },
  fileFilter: (
    _request: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const extension = extname(file.originalname).toLowerCase();
    const allowed = AVATAR_MIME_BY_EXTENSION[extension]?.includes(file.mimetype) ?? false;
    callback(allowed ? null : new Error('รูปโปรไฟล์ต้องเป็น PNG, JPG หรือ WebP'), allowed);
  },
};

class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(200)
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3, { message: 'กรอกชื่อ-นามสกุลให้ครบ' })
  @MaxLength(120)
  name!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  @MaxLength(254)
  email!: string;

  /**
   * เบอร์โทรไทย 9-10 หลัก ผู้ใช้พิมพ์ขีดหรือเว้นวรรคคั่นได้
   * ต้องตัดตัวคั่นออกก่อนตรวจ ไม่งั้น "081-234-5678" จะไม่ผ่านทั้งที่เป็นเบอร์ที่ถูกต้อง
   */
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[^0-9]/g, '') : value))
  @IsString()
  @Matches(/^[0-9]{9,10}$/, { message: 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก' })
  phone!: string;

  @IsString()
  @MinLength(8, { message: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' })
  @MaxLength(200)
  password!: string;
}

class UpdateProfileDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3, { message: 'กรอกชื่อ-นามสกุลให้ครบ' })
  @MaxLength(120)
  name!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[^0-9]/g, '') : value))
  @IsString()
  @Matches(/^[0-9]{9,10}$/, { message: 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก' })
  phone!: string;
}

class VerifyEmailDto {
  @IsString()
  @MaxLength(200)
  token!: string;
}

class VerifyCodeDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  /** ตัดช่องว่างและขีดที่ผู้ใช้อาจพิมพ์คั่นออกก่อนตรวจ */
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[^0-9]/g, '') : value))
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'รหัสยืนยันต้องเป็นตัวเลข 6 หลัก' })
  code!: string;
}

class ResendDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

class ForgotPasswordDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

class ResetPasswordDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[^0-9]/g, '') : value))
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'รหัสยืนยันต้องเป็นตัวเลข 6 หลัก' })
  code!: string;

  @IsString()
  @MinLength(8, { message: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' })
  @MaxLength(200)
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly auth: AuthService,
    @Inject(RateLimitService)
    private readonly rateLimit: RateLimitService,
  ) {}

  private async throttle(
    request: Request,
    scope: string,
    identity: string,
    limit: number,
    windowMs = 10 * 60 * 1_000,
  ): Promise<void> {
    const address = request.ip || request.socket.remoteAddress || 'unknown';
    const result = await this.rateLimit.consume(scope, `${address}:${identity}`, limit, windowMs);
    if (!result.allowed) {
      throw new HttpException(
        {
          message: 'ทำรายการถี่เกินไป กรุณารอสักครู่แล้วลองใหม่',
          retryAfterSeconds: result.retryAfterSeconds,
        },
        429,
      );
    }
  }

  @Post('login')
  async login(@Req() request: Request, @Body() body: LoginDto) {
    await this.throttle(request, 'login', body.email.trim().toLowerCase(), 10);
    return this.auth.login(body.email, body.password, body.role);
  }

  @Post('register')
  @UseInterceptors(FileInterceptor('avatar', avatarUpload))
  async register(@Req() request: Request, @Body() body: RegisterDto, @UploadedFile() avatar?: Express.Multer.File) {
    if (!avatar) throw new BadRequestException('กรุณาแนบรูปโปรไฟล์');
    try {
      await validateUploadedFiles([avatar]);
      await this.throttle(request, 'register', body.email.trim().toLowerCase(), 5);
      // ค่าถูก trim / ตัดตัวคั่น / แปลงเป็นตัวพิมพ์เล็กมาแล้วตั้งแต่ตอน validate
      return await this.auth.register(body, avatar.path);
    } catch (error) {
      await removeStoredFiles([avatar.path]);
      throw error;
    }
  }

  @Post('verify-email')
  async verifyEmail(@Req() request: Request, @Body() body: VerifyEmailDto) {
    await this.throttle(request, 'verify-email', body.token, 20);
    return this.auth.verifyEmail(body.token);
  }

  @Post('verify-code')
  async verifyCode(@Req() request: Request, @Body() body: VerifyCodeDto) {
    await this.throttle(request, 'verify-code', body.email, 8);
    return this.auth.verifyCode(body.email, body.code);
  }

  @Post('resend-verification')
  async resend(@Req() request: Request, @Body() body: ResendDto) {
    await this.throttle(request, 'resend-verification', body.email.trim().toLowerCase(), 3);
    return this.auth.resendVerification(body.email);
  }

  @Post('forgot-password')
  async forgotPassword(@Req() request: Request, @Body() body: ForgotPasswordDto) {
    await this.throttle(request, 'forgot-password', body.email, 5);
    return this.auth.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Req() request: Request, @Body() body: ResetPasswordDto) {
    await this.throttle(request, 'reset-password', body.email, 8);
    return this.auth.resetPassword(body.email, body.code, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return this.auth.me(request.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @UseInterceptors(FileInterceptor('avatar', avatarUpload))
  async updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    try {
      if (avatar) await validateUploadedFiles([avatar]);
      await this.throttle(request, 'update-profile', request.user.sub, 10);
      return await this.auth.updateProfile(request.user.sub, body, avatar?.path ?? null);
    } catch (error) {
      if (avatar) await removeStoredFiles([avatar.path]);
      throw error;
    }
  }

  /**
   * รูปโปรไฟล์ต้องล็อกอินก่อนถึงจะเปิดดูได้ และต้องกันไม่ให้ path ที่เก็บไว้ชี้ออกนอกโฟลเดอร์อัปโหลด
   */
  @UseGuards(JwtAuthGuard)
  @Get('avatar/:userId')
  async avatar(@Param('userId') userId: string, @Res() response: Response) {
    const stored = await this.auth.avatarPathFor(userId);
    if (!stored) throw new NotFoundException();
    const absolutePath = resolve(stored);
    const relativePath = relative(AVATAR_DIR(), absolutePath);
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) throw new NotFoundException();
    if (!existsSync(absolutePath)) throw new NotFoundException();
    response.sendFile(absolutePath);
  }
}
