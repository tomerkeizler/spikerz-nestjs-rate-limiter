import { HttpStatus, INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('RateLimitInterceptor - E2E', () => {
  let app: INestApplication;
  let configService: ConfigService;

  let limit: number;
  let duration: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
        imports: [AppModule, ConfigModule.forRoot({ isGlobal: true })],
      })
      .compile();

      app = module.createNestApplication();
      await app.init();

      configService = module.get<ConfigService>(ConfigService);
      limit = configService.get('rateLimit.limit');
      duration = configService.get('rateLimit.duration');
  });

  afterAll(async () => {
    if (app) {
        await app.close();
      }
  });

  it('should allow requests within the limit and return X-Count header in the response', async () => {
    const userID = uuidv4(); // Generate a random User-Id
    let remainingReauests = limit;
    
    for (let i = 0; i < limit; i++) {
        const response = await request(app.getHttpServer())
        .get('/')
        .set('User-Id', userID)
        .expect(200);
        
        remainingReauests--;
        expect(Number(response.headers['x-count'])).toBe(remainingReauests);
    }
  });

  it('should block requests that exceed the limit', async () => {
    const userID = uuidv4(); // Generate a random User-Id
    
    for (let i = 0; i < limit; i++) {
      await request(app.getHttpServer())
        .get('/') 
        .set('User-Id', userID)
        .expect(200);
    }

    await request(app.getHttpServer())
      .get('/') 
      .set('User-Id', userID)
      .expect(HttpStatus.TOO_MANY_REQUESTS);
  });

  it('should reset the limit after the TTL time passes', async () => {
    const userID = uuidv4(); // Generate a random User-Id
    
    for (let i = 0; i < limit; i++) {
      await request(app.getHttpServer())
        .get('/') 
        .set('User-Id', userID)
        .expect(200);
    }

    await request(app.getHttpServer())
      .get('/') 
        .set('User-Id', userID)
        .expect(HttpStatus.TOO_MANY_REQUESTS);

    // Wait for the rate limit TTL to pass
    await new Promise((resolve) => setTimeout(resolve, duration * 1000));

    for (let i = 0; i < limit; i++) {
      await request(app.getHttpServer())
        .get('/') 
        .set('User-Id', userID)
        .expect(200);
    }
  }, 15000);

  it('should handle multiple users successfully', async () => {
    const users = [uuidv4(), uuidv4()];

    for (const user of users) {
      for (let i = 0; i < limit; i++) {
        await request(app.getHttpServer())
          .get('/') 
          .set('User-Id', user)
          .expect(200);
      }

      await request(app.getHttpServer())
        .get('/') 
        .set('User-Id', user)
        .expect(HttpStatus.TOO_MANY_REQUESTS);
    }
  });
});
