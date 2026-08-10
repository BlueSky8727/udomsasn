import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { MediaStatus, ReviewResultValue } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaService } from '../media/media.service';

class ReviewDto {
  @IsOptional()
  @IsObject()
  results?: Record<string, ReviewResultValue | null>;

  @IsOptional()
  @IsObject()
  comments?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(4_000)
  summary?: string;

  @IsOptional()
  @IsEnum(MediaStatus)
  to?: MediaStatus;

  @IsOptional()
  @IsString()
  @MaxLength(4_000)
  reason?: string;
}

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly media: MediaService) {}

  @Post(':mediaId/draft')
  draft(@Req() request: AuthenticatedRequest, @Param('mediaId') mediaId: string, @Body() body: ReviewDto) {
    return this.media.saveReview(mediaId, request.user, body, false);
  }

  @Post(':mediaId/decision')
  decision(@Req() request: AuthenticatedRequest, @Param('mediaId') mediaId: string, @Body() body: ReviewDto) {
    return this.media.saveReview(mediaId, request.user, body, true);
  }
}
