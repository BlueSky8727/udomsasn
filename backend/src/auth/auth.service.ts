// backend/src/auth/auth.service.ts
import { Injectable,UnauthorizedException } from '@nestjs/common'; import { JwtService } from '@nestjs/jwt'; import { PrismaService } from '../prisma/prisma.service'; import * as bcrypt from 'bcrypt';
@Injectable() export class AuthService { constructor(private p:PrismaService,private jwt:JwtService){}
 async login(email:string,password:string,requestedRole?:string){ const u=await this.p.user.findUnique({where:{email:email.toLowerCase()}}); if(!u||u.accountStatus!=='ACTIVE'||!await bcrypt.compare(password,u.passwordHash)) throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง'); if(requestedRole&&u.role!==requestedRole) throw new UnauthorizedException('บัญชีนี้ไม่มีสิทธิ์ในบทบาทที่เลือก'); const token=await this.jwt.signAsync({sub:u.id,role:u.role}); return {accessToken:token,user:this.safe(u)} }
 safe(u:any){const {passwordHash,...safe}=u;return safe}
 async me(id:string){const u=await this.p.user.findUnique({where:{id}}); if(!u) throw new UnauthorizedException(); return this.safe(u)} }
