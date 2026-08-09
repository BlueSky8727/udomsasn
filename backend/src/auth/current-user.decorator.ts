// backend/src/auth/current-user.decorator.ts
import { createParamDecorator,ExecutionContext } from '@nestjs/common'; export const CurrentUser=createParamDecorator((_:unknown,c:ExecutionContext)=>c.switchToHttp().getRequest().user);
