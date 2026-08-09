// backend/src/analytics/analytics.module.ts
import{Module}from'@nestjs/common';import{AnalyticsController}from'./analytics.controller';import{AuthModule}from'../auth/auth.module';@Module({imports:[AuthModule],controllers:[AnalyticsController]})export class AnalyticsModule{}
