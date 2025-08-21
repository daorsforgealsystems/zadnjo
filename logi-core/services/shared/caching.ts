import Redis from 'ioredis';
import winston from 'winston';

// Configure logger for caching
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'caching' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export interface CacheConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
  enableReadyCheck?: boolean;
  maxMemoryPolicy?: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // For cache invalidation by tags
  compress?: boolean; // Compress large values
  serialize?: boolean; // Custom serialization
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
}

export class CacheService {
  private redis: Redis;
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0
  };

  constructor(config: CacheConfig = {}) {
    this.config = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'logi:',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: true,
      ...config
    };

    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      this.redis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
        retryDelayOnFailover: this.config.retryDelayOnFailover,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest,
        lazyConnect: this.config.lazyConnect,
        enableReadyCheck: this.config.enableReadyCheck
      });

      // Event handlers
      this.redis.on('connect', () => {
        logger.info('Connected to Redis', {
          host: this.config.host,
          port: this.config.port,
          db: this.config.db
        });
      });

      this.redis.on('ready', () => {
        logger.info('Redis connection ready');
      });

      this.redis.on('error', (error) => {
        logger.error('Redis connection error', { error: error.message });
        this.stats.errors++;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
      });

      this.redis.on('reconnecting', () => {
        logger.info('Reconnecting to Redis');
      });

    } catch (error) {
      logger.error('Failed to initialize Redis', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  async connect(): Promise<void> {
    try {
      await this.redis.connect();
      logger.info('Redis connection established');
    } catch (error) {
      logger.error('Failed to connect to Redis', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
      logger.info('Disconnected from Redis');
    } catch (error) {
      logger.error('Error disconnecting from Redis', {
        error: (error as Error).message
      });
    }
  }

  // Basic cache operations
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      
      if (value === null) {
        this.stats.misses++;
        this.updateHitRate();
        logger.debug('Cache miss', { key });
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();
      logger.debug('Cache hit', { key });

      return JSON.parse(value);
    } catch (error) {
      logger.error('Cache get error', {
        key,
        error: (error as Error).message
      });
      this.stats.errors++;
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      const ttl = options.ttl || 3600; // Default 1 hour

      let result;
      if (ttl > 0) {
        result = await this.redis.setex(key, ttl, serializedValue);
      } else {
        result = await this.redis.set(key, serializedValue);
      }

      // Add tags for cache invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addTagsToKey(key, options.tags);
      }

      this.stats.sets++;
      logger.debug('Cache set', { key, ttl, tags: options.tags });

      return result === 'OK';
    } catch (error) {
      logger.error('Cache set error', {
        key,
        error: (error as Error).message
      });
      this.stats.errors++;
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      this.stats.deletes++;
      logger.debug('Cache delete', { key });
      return result > 0;
    } catch (error) {
      logger.error('Cache delete error', {
        key,
        error: (error as Error).message
      });
      this.stats.errors++;
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', {
        key,
        error: (error as Error).message
      });
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Cache expire error', {
        key,
        ttl,
        error: (error as Error).message
      });
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error', {
        key,
        error: (error as Error).message
      });
      return -1;
    }
  }

  // Advanced cache operations
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map((value, index) => {
        if (value === null) {
          this.stats.misses++;
          logger.debug('Cache miss', { key: keys[index] });
          return null;
        }
        this.stats.hits++;
        logger.debug('Cache hit', { key: keys[index] });
        return JSON.parse(value);
      });
    } catch (error) {
      logger.error('Cache mget error', {
        keys,
        error: (error as Error).message
      });
      this.stats.errors++;
      return keys.map(() => null);
    } finally {
      this.updateHitRate();
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const serializedValue = JSON.stringify(value);
        if (ttl && ttl > 0) {
          pipeline.setex(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      });

      const results = await pipeline.exec();
      const success = results?.every(result => result && result[1] === 'OK') || false;
      
      if (success) {
        this.stats.sets += Object.keys(keyValuePairs).length;
      }

      logger.debug('Cache mset', { 
        count: Object.keys(keyValuePairs).length, 
        ttl, 
        success 
      });

      return success;
    } catch (error) {
      logger.error('Cache mset error', {
        error: (error as Error).message
      });
      this.stats.errors++;
      return false;
    }
  }

  // Cache-aside pattern with automatic refresh
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cachedValue = await this.get<T>(key);
      if (cachedValue !== null) {
        return cachedValue;
      }

      // Cache miss - fetch from source
      logger.debug('Cache miss, fetching from source', { key });
      const value = await fetchFunction();
      
      // Store in cache
      await this.set(key, value, options);
      
      return value;
    } catch (error) {
      logger.error('Cache getOrSet error', {
        key,
        error: (error as Error).message
      });
      throw error;
    }
  }

  // Tag-based cache invalidation
  private async addTagsToKey(key: string, tags: string[]): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      tags.forEach(tag => {
        const tagKey = `tag:${tag}`;
        pipeline.sadd(tagKey, key);
        pipeline.expire(tagKey, 86400); // Tags expire in 24 hours
      });

      await pipeline.exec();
    } catch (error) {
      logger.error('Error adding tags to key', {
        key,
        tags,
        error: (error as Error).message
      });
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    try {
      const tagKey = `tag:${tag}`;
      const keys = await this.redis.smembers(tagKey);
      
      if (keys.length === 0) {
        return 0;
      }

      const pipeline = this.redis.pipeline();
      keys.forEach(key => pipeline.del(key));
      pipeline.del(tagKey);

      const results = await pipeline.exec();
      const deletedCount = results?.filter(result => result && result[1] > 0).length || 0;

      logger.info('Cache invalidated by tag', { tag, deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Cache invalidate by tag error', {
        tag,
        error: (error as Error).message
      });
      return 0;
    }
  }

  // Pattern-based operations
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      logger.info('Cache deleted by pattern', { pattern, deletedCount: result });
      return result;
    } catch (error) {
      logger.error('Cache delete by pattern error', {
        pattern,
        error: (error as Error).message
      });
      return 0;
    }
  }

  async getKeysByPattern(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      logger.error('Cache get keys by pattern error', {
        pattern,
        error: (error as Error).message
      });
      return [];
    }
  }

  // Cache warming
  async warmCache<T>(
    keyValueMap: Record<string, () => Promise<T>>,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      logger.info('Starting cache warming', { 
        keyCount: Object.keys(keyValueMap).length 
      });

      const promises = Object.entries(keyValueMap).map(async ([key, fetchFn]) => {
        try {
          const value = await fetchFn();
          await this.set(key, value, options);
          logger.debug('Cache warmed', { key });
        } catch (error) {
          logger.error('Cache warm error for key', {
            key,
            error: (error as Error).message
          });
        }
      });

      await Promise.all(promises);
      logger.info('Cache warming completed');
    } catch (error) {
      logger.error('Cache warming failed', {
        error: (error as Error).message
      });
    }
  }

  // Statistics and monitoring
  getStats(): CacheStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0
    };
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  async getRedisInfo(): Promise<any> {
    try {
      const info = await this.redis.info();
      return this.parseRedisInfo(info);
    } catch (error) {
      logger.error('Error getting Redis info', {
        error: (error as Error).message
      });
      return null;
    }
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const result: any = {};
    let section = '';

    lines.forEach(line => {
      if (line.startsWith('#')) {
        section = line.substring(2).toLowerCase();
        result[section] = {};
      } else if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (section) {
          result[section][key] = isNaN(Number(value)) ? value : Number(value);
        }
      }
    });

    return result;
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed', {
        error: (error as Error).message
      });
      return false;
    }
  }

  // Flush operations (use with caution)
  async flushDb(): Promise<boolean> {
    try {
      await this.redis.flushdb();
      logger.warn('Cache database flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error', {
        error: (error as Error).message
      });
      return false;
    }
  }
}

// Factory function to create a configured cache service
export function createCacheService(config?: CacheConfig): CacheService {
  return new CacheService(config);
}

// Decorator for caching method results
export function Cacheable(key: string, options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = (this as any).cacheService as CacheService;
      if (!cache) {
        return method.apply(this, args);
      }

      const cacheKey = typeof key === 'function' ? key(...args) : key;
      
      return cache.getOrSet(cacheKey, async () => {
        return method.apply(this, args);
      }, options);
    };
  };
}

// Cache key builders
export class CacheKeyBuilder {
  static user(userId: string): string {
    return `user:${userId}`;
  }

  static userProfile(userId: string): string {
    return `user:${userId}:profile`;
  }

  static userPreferences(userId: string): string {
    return `user:${userId}:preferences`;
  }

  static order(orderId: string): string {
    return `order:${orderId}`;
  }

  static ordersByUser(userId: string): string {
    return `orders:user:${userId}`;
  }

  static inventory(itemId: string): string {
    return `inventory:${itemId}`;
  }

  static route(routeId: string): string {
    return `route:${routeId}`;
  }

  static vehicleLocation(vehicleId: string): string {
    return `vehicle:${vehicleId}:location`;
  }

  static session(sessionId: string): string {
    return `session:${sessionId}`;
  }

  static apiResponse(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? `:${JSON.stringify(params)}` : '';
    return `api:${endpoint}${paramString}`;
  }
}