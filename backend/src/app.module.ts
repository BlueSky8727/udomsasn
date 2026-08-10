// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MediaModule } from './media/media.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
@Module({imports:[ConfigModule.forRoot({isGlobal:true}),PrismaModule,AuthModule,UsersModule,MediaModule,ReviewsModule,AnalyticsModule,NotificationsModule]}) export class AppModule{}
