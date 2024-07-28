import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { CacheProvider } from './providers/cache.provider';
import rateLimitConfig from './config/rate-limit.config';
import { RateLimitInterceptor } from './interceptors/rate-limit.interceptor';
import { RateLimitService } from './services/rate-limit.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [rateLimitConfig],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CacheProvider,
    RateLimitService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
  ],
})
export class AppModule {}
