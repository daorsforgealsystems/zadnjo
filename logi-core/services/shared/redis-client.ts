import { createClient } from 'redis';

// Redis client configuration
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
  },
});

// Redis connection event handlers
redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('reconnecting', () => {
  console.log('Reconnecting to Redis...');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Retry connection after 5 seconds
    setTimeout(connectRedis, 5000);
  }
};

// Initialize Redis connection
connectRedis();

// Cache utility functions
export class CacheManager {
  private static readonly DEFAULT_TTL = 3600; // 1 hour in seconds
  private static readonly SHORT_TTL = 300; // 5 minutes in seconds
  private static readonly LONG_TTL = 86400; // 24 hours in seconds

  /**
   * Get value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  static async set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Check if key exists in cache
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern - get from cache if exists, otherwise set and return
   */
  static async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cachedValue = await this.get<T>(key);
      if (cachedValue !== null) {
        return cachedValue;
      }

      // If not in cache, fetch the data
      const freshValue = await fetchFunction();
      
      // Set in cache for future requests
      await this.set(key, freshValue, ttl);
      
      return freshValue;
    } catch (error) {
      console.error(`Cache getOrSet error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear cache by pattern
   */
  static async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error(`Cache clear pattern error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Increment a counter in cache
   */
  static async increment(key: string, increment: number = 1): Promise<number> {
    try {
      return await redisClient.incrBy(key, increment);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set expiration for a key
   */
  static async expire(key: string, ttl: number): Promise<void> {
    try {
      await redisClient.expire(key, ttl);
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
    }
  }

  /**
   * Get TTL for a key
   */
  static async ttl(key: string): Promise<number> {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  // Predefined TTL constants
  static get TTL() {
    return {
      DEFAULT: this.DEFAULT_TTL,
      SHORT: this.SHORT_TTL,
      LONG: this.LONG_TTL,
    };
  }
}

// Cache key generators for different entities
export const CacheKeys = {
  // Vehicle related keys
  vehicle: (id: string) => `vehicle:${id}`,
  vehicles: (filters?: string) => `vehicles:${filters || 'all'}`,
  vehiclePositions: (vehicleId: string) => `vehicle:positions:${vehicleId}`,
  
  // Order related keys
  order: (id: string) => `order:${id}`,
  orders: (filters?: string) => `orders:${filters || 'all'}`,
  orderStats: (timeframe: string) => `orders:stats:${timeframe}`,
  
  // User related keys
  user: (id: string) => `user:${id}`,
  userPreferences: (userId: string) => `user:preferences:${userId}`,
  
  // System related keys
  systemHealth: () => `system:health`,
  apiMetrics: (endpoint: string) => `api:metrics:${endpoint}`,
  
  // Route optimization keys
  optimizedRoute: (routeId: string) => `route:optimized:${routeId}`,
  
  // Notification keys
  notifications: (userId: string) => `notifications:${userId}`,
};

export default redisClient;