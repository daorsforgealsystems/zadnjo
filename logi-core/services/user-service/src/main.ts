import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get } from '@nestjs/common';
import { PreferencesController } from './controllers/preferences.controller';
import { NavigationController } from './controllers/navigation.controller';
import { PreferencesService } from './services/preferences.service';
import { NavigationService } from './services/navigation.service';

@Controller('users')
class UsersController {
  @Get('me')
  me() {
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
  }

  @Get(':userId/profile')
  getUserProfile() {
    return {
      id: 'dev',
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
  }
}

@Controller()
class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date(), service: 'user-service' };
  }
}

@Module({ 
  controllers: [
    UsersController, 
    HealthController,
    PreferencesController,
    NavigationController
  ],
  providers: [
    PreferencesService,
    NavigationService
  ]
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  
  // eslint-disable-next-line no-console
  console.log(`🚀 User Service listening on ${port}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - GET  /api/users/me`);
  console.log(`   - GET  /api/preferences/layout/:userId`);
  console.log(`   - GET  /api/navigation/menu/:role`);
  console.log(`   - And more...`);
}

bootstrap();