import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { existsSync, unlinkSync } from 'node:fs';
import { AccountStatus, UserRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsOptional()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  /** ผู้ดูแลระบบและหัวหน้าวิชาการเปิดดูรายชื่อได้ แต่หัวหน้าวิชาการแก้ไขไม่ได้ (ดู PATCH ข้างล่าง) */
  @Get()
  all(@Req() request: AuthenticatedRequest) {
    const canView: UserRole[] = [UserRole.ADMIN, UserRole.ACADEMIC_HEAD];
    if (!canView.includes(request.user.role)) throw new ForbiddenException();
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, phone: true, emailVerifiedAt: true, role: true, accountStatus: true, department: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * ตั้งตำแหน่งได้เฉพาะผู้ดูแลระบบเท่านั้น
   * หัวหน้าวิชาการเปิดหน้ารายชื่อได้ก็จริง แต่ยิง PATCH มาต้องโดนปฏิเสธที่นี่เสมอ
   * การซ่อนปุ่มใน UI ไม่นับเป็นการป้องกัน (กฎเหล็กข้อ 2)
   */
  @Patch(':id')
  update(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateUserDto) {
    if (request.user.role !== UserRole.ADMIN) throw new ForbiddenException('เฉพาะผู้ดูแลระบบเท่านั้นที่ตั้งตำแหน่งได้');
    if (body.role === UserRole.ADMIN) throw new ForbiddenException('ไม่อนุญาตแต่งตั้งผู้ดูแลระบบผ่านหน้ารายชื่อ');
    return this.prisma.user.update({
      where: { id },
      data: {
        role: body.role,
        department: body.department?.trim() || null,
        accountStatus: body.accountStatus,
      },
      select: { id: true, email: true, name: true, phone: true, emailVerifiedAt: true, role: true, accountStatus: true, department: true, createdAt: true },
    });
  }

  /**
   * ลบบัญชีถาวร — เฉพาะผู้ดูแลระบบ และเฉพาะบัญชีที่ยังไม่มีร่องรอยในกระบวนการตรวจ
   *
   * ถ้าเจ้าของบัญชีเคยส่งสื่อ ตรวจสื่อ หรือเปลี่ยนสถานะอะไรไว้ ห้ามลบเด็ดขาด
   * เพราะประวัติการตรวจต้องอยู่ครบเสมอ (กฎเหล็กข้อ 5) กรณีนั้นให้ใช้ "ระงับการใช้งาน" แทน
   */
  @Delete(':id')
  async remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    if (request.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('เฉพาะผู้ดูแลระบบเท่านั้นที่ลบบัญชีได้');
    }
    if (request.user.sub === id) throw new BadRequestException('ลบบัญชีของตัวเองไม่ได้');

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        avatarPath: true,
        _count: { select: { media: true, reviews: true, statusLogs: true, aiReviews: true, assignedMedia: true } },
      },
    });
    if (!user) throw new NotFoundException('ไม่พบบัญชีนี้');
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('ลบบัญชีผู้ดูแลระบบผ่านหน้ารายชื่อไม่ได้');
    }

    const { media, reviews, statusLogs, aiReviews, assignedMedia } = user._count;
    const history = media + reviews + statusLogs + aiReviews + assignedMedia;
    if (history > 0) {
      throw new BadRequestException(
        `${user.name} มีประวัติการใช้งานในระบบอยู่ ${history} รายการ ลบถาวรไม่ได้ กรุณาใช้ "ระงับการใช้งาน" แทน`,
      );
    }

    await this.prisma.user.delete({ where: { id } });
    // โทเคนยืนยันอีเมล/รหัสผ่านและการแจ้งเตือนถูกลบตามด้วย cascade ในฐานข้อมูล
    if (user.avatarPath && existsSync(user.avatarPath)) {
      try {
        unlinkSync(user.avatarPath);
      } catch {
        // ลบไฟล์รูปไม่สำเร็จไม่ควรทำให้การลบบัญชีล้มเหลว
      }
    }
    return { id, message: `ลบบัญชีของ ${user.name} เรียบร้อยแล้ว` };
  }
}
