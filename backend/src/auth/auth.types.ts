import type { Request } from 'express';
import type { UserRole } from '@prisma/client';

export type JwtUser = { sub: string; role: UserRole; iat?: number; exp?: number };
export type AuthenticatedRequest = Request & { user: JwtUser };
