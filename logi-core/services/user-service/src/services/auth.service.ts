import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { 
  LoginDto, 
  RegisterDto, 
  TokenPayload, 
  UserResponseDto 
} from '../dto/auth.dto';

@Injectable()
export class AuthService {
  // In-memory storage for development - in production, use a database
  private users = new Map<string, any>();
  private refreshTokens = new Map<string, { userId: string; expiresAt: Date }>();
  private passwordResetTokens = new Map<string, { userId: string; expiresAt: Date }>();

  constructor() {
    this.initializeDefaultUsers();
  }

  async login(loginDto: LoginDto) {
    const user = this.users.get(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();

    // Generate tokens
    const accessToken = this.generateAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles
    });

    const refreshToken = this.generateRefreshToken({
      sub: user.id,
      email: user.email,
      roles: user.roles
    });

    // Store refresh token
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return {
      accessToken,
      refreshToken,
      user: this.mapUserToResponse(user)
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    if (this.users.has(registerDto.email)) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const user = {
      id: `user_${uuidv4()}`,
      email: registerDto.email,
      fullName: registerDto.fullName,
      passwordHash,
      roles: ['USER'], // Default role
      company: registerDto.company,
      phone: registerDto.phone,
      avatar: null,
      createdAt: new Date(),
      lastLoginAt: null
    };

    this.users.set(registerDto.email, user);

    return this.mapUserToResponse(user);
  }

  async refreshToken(refreshToken: string) {
    const tokenData = this.refreshTokens.get(refreshToken);
    
    if (!tokenData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenData.expiresAt < new Date()) {
      this.refreshTokens.delete(refreshToken);
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = Array.from(this.users.values()).find(u => u.id === tokenData.userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new tokens
    const accessToken = this.generateAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles
    });

    const newRefreshToken = this.generateRefreshToken({
      sub: user.id,
      email: user.email,
      roles: user.roles
    });

    // Remove old refresh token and store new one
    this.refreshTokens.delete(refreshToken);
    this.refreshTokens.set(newRefreshToken, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: this.mapUserToResponse(user)
    };
  }

  async logout(refreshToken: string) {
    this.refreshTokens.delete(refreshToken);
  }

  async sendPasswordResetEmail(email: string) {
    const user = this.users.get(email);
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return;
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    this.passwordResetTokens.set(resetToken, {
      userId: user.id,
      expiresAt
    });

    // In a real implementation, you would send an email here
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenData = this.passwordResetTokens.get(token);
    
    if (!tokenData) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (tokenData.expiresAt < new Date()) {
      this.passwordResetTokens.delete(token);
      throw new BadRequestException('Reset token expired');
    }

    const user = Array.from(this.users.values()).find(u => u.id === tokenData.userId);
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    user.passwordHash = passwordHash;
    
    // Remove used token
    this.passwordResetTokens.delete(token);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = Array.from(this.users.values()).find(u => u.id === userId);
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    user.passwordHash = passwordHash;
  }

  async getUserPermissions(userId: string) {
    const user = Array.from(this.users.values()).find(u => u.id === userId);
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // In a real implementation, this would come from a permissions system
    const permissions = {
      canManageUsers: user.roles.includes('ADMIN'),
      canManageSystem: user.roles.includes('ADMIN'),
      canViewAnalytics: user.roles.includes('ADMIN') || user.roles.includes('MANAGER'),
      canCreateOrders: true,
      canEditOrders: user.roles.includes('ADMIN') || user.roles.includes('MANAGER'),
      canDeleteOrders: user.roles.includes('ADMIN'),
      canViewReports: true,
      canExportData: user.roles.includes('ADMIN') || user.roles.includes('MANAGER')
    };

    return permissions;
  }

  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m'
    });
  }

  private generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret', {
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d'
    });
  }

  private mapUserToResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      avatar: user.avatar,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    };
  }

  private initializeDefaultUsers(): void {
    // Create default admin user for development
    const adminUser = {
      id: 'user_admin',
      email: 'admin@example.com',
      fullName: 'Admin User',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', // password: admin123
      roles: ['ADMIN'],
      avatar: null,
      createdAt: new Date(),
      lastLoginAt: null
    };

    this.users.set(adminUser.email, adminUser);
  }
}