import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
  import { RateLimitService } from '../services/rate-limit.service';

  @Injectable()
  export class RateLimitInterceptor implements NestInterceptor {
    constructor(private readonly rateLimitService: RateLimitService) {}
  
async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      const request = context.switchToHttp().getRequest();
      const userID = request.headers['user-id'];

      if (!userID) {
        throw new HttpException('User ID header is missing', HttpStatus.BAD_REQUEST);
      }

      await this.rateLimitService.enforceUserRateLimiting(userID);

      const userRemainingRequestCount = await this.rateLimitService.getUserRemainingRequestCount(userID);

      return next.handle().pipe(
        tap(() => {
          const response = context.switchToHttp().getResponse();
          response.header('X-Count', userRemainingRequestCount);
        })
      );
    }
  }