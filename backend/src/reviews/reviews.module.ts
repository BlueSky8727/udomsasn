// backend/src/reviews/reviews.module.ts
import{Module}from'@nestjs/common';import{ReviewsController}from'./reviews.controller';import{AuthModule}from'../auth/auth.module';import{MediaModule}from'../media/media.module';@Module({imports:[AuthModule,MediaModule],controllers:[ReviewsController]})export class ReviewsModule{}
