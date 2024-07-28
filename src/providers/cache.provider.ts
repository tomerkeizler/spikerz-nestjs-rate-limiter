import { createClient } from 'redis-mock';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheProvider {
  private readonly redisClient = createClient({ host: 'localhost', port: 6379 });

//   constructor() {
//     this.redisClient = createClient({ host: 'localhost', port: 6379 });
//   }

    async get(type: string, identifier: string): Promise<any> {
        const key = `${type}:${identifier}`;
        return new Promise((resolve, reject) => {
            this.redisClient.get(key, (err, reply) => {
              if (err) {
                return reject(err);
              }
              resolve(reply);
            });
          });
    }

    async set(type: string, identifier: string, value: any, mode: string, duration: number): Promise<void> {
        const key = `${type}:${identifier}`;
        return new Promise((resolve, reject) => {
            this.redisClient.set(key, value, mode, duration, (err, reply) => {
              if (err) {
                return reject(err);
              }
              resolve();
            });
          });
    }

    async increment(type: string, identifier: string): Promise<void> {
        const key = `${type}:${identifier}`;
        return new Promise((resolve, reject) => {
            this.redisClient.incr(key, (err, reply) => {
              if (err) {
                return reject(err);
              }
              resolve();
            });
          });
    }

    async getTTL(type: string, identifier: string): Promise<any> {
        const key = `${type}:${identifier}`;
        return new Promise((resolve, reject) => {
            this.redisClient.ttl(key, (err, reply) => {
              if (err) {
                return reject(err);
              }
              resolve(reply);
            });
          });
    }
}