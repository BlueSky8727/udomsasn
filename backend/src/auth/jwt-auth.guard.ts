import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedRequest, JwtUser } from './auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService)
    private readonly jwt: JwtService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedException();
    try {
      const payload = await this.jwt.verifyAsync<JwtUser>(token);
      const account = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, accountStatus: true, emailVerifiedAt: true },
      });
      if (!account || account.accountStatus !== 'ACTIVE' || !account.emailVerifiedAt) {
        throw new UnauthorizedException();
      }

      // ใช้ตำแหน่งล่าสุดจากฐานข้อมูลเสมอ ไม่เชื่อ role เก่าที่ฝังอยู่ใน JWT
      request.user = {
        sub: account.id,
        role: account.role,
        iat: payload.iat,
        exp: payload.exp,
      };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
