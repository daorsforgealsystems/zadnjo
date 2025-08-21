import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get, Post, Put, Body, Param, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PreferencesController } from './controllers/preferences.controller';
import { NavigationController } from './controllers/navigation.controller';
import { PreferencesService } from './services/preferences.service';
import { NavigationService } from './services/navigation.service';
import winston from 'winston';

// Import shared modules (these would be imported from the shared package in production)
import { MessageQueue, createMessageQueue, LogisticsEvents } from '../../../shared/message-queue';
import { ServiceDiscovery, createServiceDiscovery, createServiceConfig } from '../../../shared/service-discovery';
import { DistributedTracing, initializeTracing } from '../../../shared/distributed-tracing';
import { CacheService, createCacheService, CacheKeyBuilder } from '../../../shared/caching';

// Configure structured logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

@Injectable()
class InfrastructureService implements OnModuleInit, OnModuleDestroy {
  private messageQueue: MessageQueue;
  private serviceDiscovery: ServiceDiscovery;
  private tracing: DistributedTracing;
  private cache: CacheService;

  constructor() {
    // Initialize message queue
    this.messageQueue = createMessageQueue({
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672'
    });

    // Initialize service discovery
    this.serviceDiscovery = createServiceDiscovery({
      consulHost: process.env.CONSUL_HOST || '127.0.0.1',
      consulPort: parseInt(process.env.CONSUL_PORT || '8500')
    });

    // Initialize distributed tracing
    this.tracing = initializeTracing('user-service', {
      jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
    });

    // Initialize cache
    this.cache = createCacheService({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      keyPrefix: 'user-service:'
    });
  }

  async onModuleInit() {
    try {
      // Connect to message queue
      await this.messageQueue.connect();
      
      // Set up message queue consumers
      await this.setupMessageConsumers();

      // Connect to cache
      await this.cache.connect();

      // Register service with service discovery
      const serviceConfig = createServiceConfig('user-service', parseInt(process.env.PORT || '4001'), {
        tags: ['api', 'users', 'preferences'],
        meta: {
          version: process.env.SERVICE_VERSION || '1.0.0',
          capabilities: 'user-management,preferences,navigation'
        }
      });

      await this.serviceDiscovery.registerService(serviceConfig);

      logger.info('Infrastructure services initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize infrastructure services', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      // Cleanup in reverse order
      await this.serviceDiscovery.deregisterAllServices();
      await this.cache.disconnect();
      await this.messageQueue.disconnect();
      await this.tracing.shutdown();

      logger.info('Infrastructure services cleaned up successfully');
    } catch (error) {
      logger.error('Error during infrastructure cleanup', {
        error: (error as Error).message
      });
    }
  }

  private async setupMessageConsumers() {
    // Assert queues
    await this.messageQueue.assertQueue('user-events');
    await this.messageQueue.assertQueue('user-notifications');

    // Set up consumers
    await this.messageQueue.consume('user-events', async (data, metadata) => {
      logger.info('Received user event', { data, metadata });
      
      // Process user events (e.g., user created, updated)
      await this.handleUserEvent(data);
    });

    await this.messageQueue.consume('user-notifications', async (data, metadata) => {
      logger.info('Received notification request', { data, metadata });
      
      // Process notification requests
      await this.handleNotificationRequest(data);
    });
  }

  private async handleUserEvent(eventData: any) {
    try {
      await this.tracing.withSpan('handle-user-event', async (span) => {
        span.setAttributes({
          'event.type': eventData.type,
          'user.id': eventData.userId
        });

        switch (eventData.type) {
          case 'user.created':
            await this.handleUserCreated(eventData);
            break;
          case 'user.updated':
            await this.handleUserUpdated(eventData);
            break;
          default:
            logger.warn('Unknown user event type', { type: eventData.type });
        }
      });
    } catch (error) {
      logger.error('Error handling user event', {
        eventData,
        error: (error as Error).message
      });
    }
  }

  private async handleUserCreated(eventData: any) {
    // Initialize default preferences for new user
    const defaultPreferences = {
      theme: 'light',
      notifications: true,
      language: 'en',
      timezone: 'UTC'
    };

    // Cache default preferences
    await this.cache.set(
      CacheKeyBuilder.userPreferences(eventData.userId),
      defaultPreferences,
      { ttl: 3600, tags: ['user-preferences'] }
    );

    logger.info('Default preferences created for new user', {
      userId: eventData.userId
    });
  }

  private async handleUserUpdated(eventData: any) {
    // Invalidate user-related cache entries
    await this.cache.invalidateByTag('user-preferences');
    await this.cache.delete(CacheKeyBuilder.userProfile(eventData.userId));

    logger.info('User cache invalidated', {
      userId: eventData.userId
    });
  }

  private async handleNotificationRequest(notificationData: any) {
    // Process notification requests
    logger.info('Processing notification request', {
      userId: notificationData.userId,
      type: notificationData.type
    });

    // Here you would integrate with notification service
    // For now, just log the notification
  }

  // Getters for other services to access infrastructure
  getMessageQueue(): MessageQueue {
    return this.messageQueue;
  }

  getServiceDiscovery(): ServiceDiscovery {
    return this.serviceDiscovery;
  }

  getTracing(): DistributedTracing {
    return this.tracing;
  }

  getCache(): CacheService {
    return this.cache;
  }
}

@Injectable()
class EnhancedUserService {
  constructor(private infrastructure: InfrastructureService) {}

  async getUserProfile(userId: string) {
    const cache = this.infrastructure.getCache();
    const tracing = this.infrastructure.getTracing();

    return tracing.withSpan('get-user-profile', async (span) => {
      span.setAttributes({ 'user.id': userId });

      // Try cache first
      const cacheKey = CacheKeyBuilder.userProfile(userId);
      const cachedProfile = await cache.get(cacheKey);
      
      if (cachedProfile) {
        span.addEvent('cache-hit');
        return cachedProfile;
      }

      // Simulate database fetch
      span.addEvent('database-fetch');
      const profile = {
        id: userId,
        name: 'Development User',
        email: 'dev@example.com',
        role: 'ADMIN',
        avatar: null,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        }
      };

      // Cache the result
      await cache.set(cacheKey, profile, { 
        ttl: 1800, // 30 minutes
        tags: ['user-profile'] 
      });

      return profile;
    });
  }

  async updateUserProfile(userId: string, updates: any) {
    const messageQueue = this.infrastructure.getMessageQueue();
    const cache = this.infrastructure.getCache();
    const tracing = this.infrastructure.getTracing();

    return tracing.withSpan('update-user-profile', async (span) => {
      span.setAttributes({ 
        'user.id': userId,
        'update.fields': Object.keys(updates).join(',')
      });

      // Simulate database update
      span.addEvent('database-update');
      
      // Invalidate cache
      await cache.delete(CacheKeyBuilder.userProfile(userId));
      await cache.invalidateByTag('user-profile');

      // Publish user updated event
      await messageQueue.publish('user-events', {
        type: LogisticsEvents.USER_UPDATED,
        userId,
        updates,
        timestamp: new Date().toISOString()
      });

      logger.info('User profile updated', { userId, updates });

      return { success: true, userId, updates };
    });
  }
}

@Controller('users')
class EnhancedUsersController {
  constructor(
    private userService: EnhancedUserService,
    private infrastructure: InfrastructureService
  ) {}

  @Get('me')
  async me() {
    const tracing = this.infrastructure.getTracing();
    
    return tracing.withSpan('get-current-user', async (span) => {
      span.setAttributes({ 'endpoint': '/users/me' });
      
      return { 
        id: 'dev', 
        roles: ['ADMIN'], 
        email: 'dev@example.com',
        name: 'Development User',
        avatar: null,
        permissions: {
          canManageUsers: true,
          canManageSystem: true,
          canViewAnalytics: true
        }
      };
    });
  }

  @Get(':userId/profile')
  async getUserProfile(@Param('userId') userId: string) {
    return this.userService.getUserProfile(userId);
  }

  @Put(':userId/profile')
  async updateUserProfile(@Param('userId') userId: string, @Body() updates: any) {
    return this.userService.updateUserProfile(userId, updates);
  }

  @Post(':userId/notify')
  async sendNotification(@Param('userId') userId: string, @Body() notification: any) {
    const messageQueue = this.infrastructure.getMessageQueue();
    const tracing = this.infrastructure.getTracing();

    return tracing.withSpan('send-user-notification', async (span) => {
      span.setAttributes({ 
        'user.id': userId,
        'notification.type': notification.type
      });

      await messageQueue.publish('user-notifications', {
        userId,
        type: notification.type,
        message: notification.message,
        priority: notification.priority || 'normal',
        timestamp: new Date().toISOString()
      });

      return { success: true, message: 'Notification queued' };
    });
  }
}

@Controller()
class EnhancedHealthController {
  constructor(private infrastructure: InfrastructureService) {}

  @Get('health')
  async health() {
    const cache = this.infrastructure.getCache();
    const messageQueue = this.infrastructure.getMessageQueue();
    const serviceDiscovery = this.infrastructure.getServiceDiscovery();

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'user-service',
      version: process.env.SERVICE_VERSION || '1.0.0',
      dependencies: {
        cache: await cache.isHealthy(),
        messageQueue: messageQueue.isConnected(),
        serviceDiscovery: await serviceDiscovery.isConsulHealthy()
      }
    };

    // Set overall status based on dependencies
    const allHealthy = Object.values(health.dependencies).every(status => status === true);
    if (!allHealthy) {
      health.status = 'degraded';
    }

    return health;
  }

  @Get('metrics')
  async metrics() {
    const cache = this.infrastructure.getCache();
    const messageQueue = this.infrastructure.getMessageQueue();

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cache: {
        stats: cache.getStats(),
        info: await cache.getRedisInfo()
      },
      messageQueue: messageQueue.getConnectionInfo(),
      nodejs: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
  }
}

@Module({ 
  controllers: [
    EnhancedUsersController, 
    EnhancedHealthController,
    PreferencesController,
    NavigationController
  ],
  providers: [
    InfrastructureService,
    EnhancedUserService,
    PreferencesService,
    NavigationService
  ]
})
class EnhancedAppModule {}

async function bootstrap() {
  try {
    const app = await NestFactory.create(EnhancedAppModule);
    
    // Get infrastructure service for tracing middleware
    const infrastructure = app.get(InfrastructureService);
    const tracing = infrastructure.getTracing();

    // Add distributed tracing middleware
    app.use(tracing.createNestMiddleware());

    app.enableCors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    });
    
    // Global prefix for all routes
    app.setGlobalPrefix('api');
    
    const port = process.env.PORT || 4001;
    await app.listen(port);
    
    logger.info('Enhanced User Service started successfully', {
      port,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.SERVICE_VERSION || '1.0.0'
    });

    console.log(`🚀 Enhanced User Service listening on ${port}`);
    console.log(`📡 Available endpoints:`);
    console.log(`   - GET  /api/health`);
    console.log(`   - GET  /api/metrics`);
    console.log(`   - GET  /api/users/me`);
    console.log(`   - GET  /api/users/:userId/profile`);
    console.log(`   - PUT  /api/users/:userId/profile`);
    console.log(`   - POST /api/users/:userId/notify`);
    console.log(`   - GET  /api/preferences/layout/:userId`);
    console.log(`   - GET  /api/navigation/menu/:role`);

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);
      
      try {
        await app.close();
        logger.info('Application closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error: (error as Error).message });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start Enhanced User Service', {
      error: (error as Error).message
    });
    process.exit(1);
  }
}

bootstrap();