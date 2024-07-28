import { Injectable, HttpException,HttpStatus } from '@nestjs/common';
import { CacheProvider } from '../providers/cache.provider';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitService {
  private readonly cacheType: string = 'rate_limiter'; // prefix of a rate-limiter cache key

  constructor(private cacheProvider: CacheProvider, private configService: ConfigService) {}

  get limit(): number { // Maximum requests per user in the given duration
    return this.configService.get('rateLimit.limit');
  }

  get duration(): number { // Duration in seconds
    return this.configService.get('rateLimit.duration');
  }

  public async getUserRequestCount(userID: string): Promise<number> {
    const userRequestCount = await this.cacheProvider.get(this.cacheType, userID);
    return parseInt(userRequestCount) || 0;
  }

  public async getUserRemainingRequestCount(userID: string): Promise<number> {
    const userRequestCount = await this.getUserRequestCount(userID);
    return this.limit - userRequestCount;
  }

  public async initializeUserRequestCount(userID: string) {
    await this.cacheProvider.set(this.cacheType, userID, 1, 'EX', this.duration);
  }

  public async incrementUserRequestCount(userID: string) {
    await this.cacheProvider.increment(this.cacheType, userID);
  }

  public async getUserRequestCountTTL(userID: string): Promise<number> {
    const ttl = await this.cacheProvider.getTTL(this.cacheType, userID);
    return parseInt(ttl);
  }

  public async enforceUserRateLimiting(userID: string): Promise<void> {
    const userRequestCount = await this.getUserRequestCount(userID);

    if (userRequestCount >= this.limit) {
      const ttl = await this.getUserRequestCountTTL(userID);
      throw new HttpException(`Rate limit exceeded! Please try again in ${ttl} seconds.`, HttpStatus.TOO_MANY_REQUESTS);
    }
      
    if (userRequestCount === 0) {
      await this.initializeUserRequestCount(userID);
    }
    else {
      await this.incrementUserRequestCount(userID);
    }
  }
}