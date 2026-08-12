import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MediaStatus, Prisma } from '@prisma/client';
import type { Response } from 'express';
import { mkdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { diskStorage } from 'multer';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaService, type MediaInput } from './media.service';
import { removeStoredFiles, validateUploadedFiles } from './upload-security';

const MIME_BY_EXTENSION: Record<string, readonly string[]> = {
  '.pdf': ['application/pdf'],
  '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.mp4': ['video/mp4'],
};

const uploadOptions = {
  storage: diskStorage({
    destination: (_request: unknown, _file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) => {
      const destination = resolve(process.env.UPLOAD_DIR ?? 'uploads');
      mkdirSync(destination, { recursive: true });
      callback(null, destination);
    },
    filename: (_request, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { files: 10, fileSize: Number(process.env.MAX_UPLOAD_BYTES ?? 52_428_800) },
  fileFilter: (_request: unknown, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
    const extension = extname(file.originalname).toLowerCase();
    const allowed = MIME_BY_EXTENSION[extension]?.includes(file.mimetype) ?? false;
    callback(allowed ? null : new Error('ชนิดไฟล์ไม่รองรับหรือ MIME ไม่ตรงกับนามสกุล'), allowed);
  },
};

class TransitionDto {
  @IsEnum(MediaStatus)
  to!: MediaStatus;

  @IsOptional()
  @IsString()
  @MaxLength(4_000)
  reason?: string;
}

class AiReviewDto {
  @IsString()
  @MaxLength(40)
  provider!: string;

  @IsObject()
  result!: Record<string, unknown>;
}

function metadata(body: Record<string, unknown>): MediaInput {
  try {
    return (typeof body.metadata === 'string' ? JSON.parse(body.metadata) : body) as MediaInput;
  } catch {
    throw new BadRequestException('metadata ไม่ใช่ JSON ที่ถูกต้อง');
  }
}

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, uploadOptions))
  async create(@Req() request: AuthenticatedRequest, @Body() body: Record<string, unknown>, @UploadedFiles() files: Express.Multer.File[] = []) {
    try {
      await validateUploadedFiles(files);
      return await this.media.create(request.user, metadata(body), files);
    } catch (error) {
      await removeStoredFiles(files.map((file) => file.path));
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files', 10, uploadOptions))
  async update(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: Record<string, unknown>, @UploadedFiles() files: Express.Multer.File[] = []) {
    try {
      await validateUploadedFiles(files);
      return await this.media.update(request.user, id, metadata(body), files);
    } catch (error) {
      await removeStoredFiles(files.map((file) => file.path));
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  mine(@Req() request: AuthenticatedRequest) {
    return this.media.mine(request.user.sub);
  }

  @Get('public')
  publicList() {
    return this.media.publicList();
  }

  @UseGuards(JwtAuthGuard)
  @Get('queue')
  queue(@Req() request: AuthenticatedRequest) {
    return this.media.queue(request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/extracted-text')
  extractedText(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.media.extractedText(id, request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/files/:fileId/download')
  async download(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Param('fileId') fileId: string, @Res() response: Response) {
    const file = await this.media.fileForDownload(id, fileId, request.user);
    response.type(file.mimeType);
    response.setHeader('Content-Length', String(file.size));
    response.download(file.absolutePath, file.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  one(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.media.one(id, request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/transition')
  transition(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: TransitionDto) {
    return this.media.transition(id, request.user, body.to, body.reason);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/ai-reviews')
  aiReview(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: AiReviewDto) {
    return this.media.saveAiReview(id, request.user, body.provider, body.result as Prisma.InputJsonValue);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.media.remove(id, request.user);
  }
}
