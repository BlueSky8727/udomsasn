import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

class ReadDto {
  @IsBoolean()
  read!: boolean;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.prisma.notification.findMany({
      where: { userId: request.user.sub },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Get('unread-count')
  async unreadCount(@Req() request: AuthenticatedRequest) {
    return { count: await this.prisma.notification.count({ where: { userId: request.user.sub, readAt: null } }) };
  }

  @Patch(':id/read')
  async setRead(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: ReadDto) {
    const notification = await this.prisma.notification.findFirstOrThrow({ where: { id, userId: request.user.sub } });
    return this.prisma.notification.update({ where: { id: notification.id }, data: { readAt: body.read ? new Date() : null } });
  }

  @Post('read-all')
  async readAll(@Req() request: AuthenticatedRequest) {
    const result = await this.prisma.notification.updateMany({ where: { userId: request.user.sub, readAt: null }, data: { readAt: new Date() } });
    return { updated: result.count };
  }
}
