// backend/src/media/media.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [AuthModule, MailModule],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
