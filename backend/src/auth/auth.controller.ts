// backend/src/auth/auth.controller.ts
import { Body,Controller,Get,Post,Req,UseGuards } from '@nestjs/common'; import { IsEmail,IsOptional,IsString,MinLength } from 'class-validator'; import { AuthService } from './auth.service'; import { JwtAuthGuard } from './jwt-auth.guard';
class LoginDto{ @IsEmail() email!:string; @IsString() @MinLength(6) password!:string; @IsOptional() @IsString() role?:string }
@Controller('auth') export class AuthController{constructor(private s:AuthService){} @Post('login') login(@Body()d:LoginDto){return this.s.login(d.email,d.password,d.role)} @UseGuards(JwtAuthGuard) @Get('me') me(@Req()r:any){return this.s.me(r.user.sub)} }
