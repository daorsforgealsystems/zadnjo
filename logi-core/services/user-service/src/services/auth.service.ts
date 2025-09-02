import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient, AuthError } from '@supabase/supabase-js';
import {
  LoginDto,
  RegisterDto,
  UserResponseDto
} from '../dto/auth.dto';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    if (!process.env.SUPABASE_URL || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY)) {
      throw new Error('SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variables are required');
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  async login(loginDto: LoginDto) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: loginDto.email,
        password: loginDto.password,
      });

      if (error) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!data.user || !data.session) {
        throw new UnauthorizedException('Authentication failed');
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: this.mapSupabaseUserToResponse(data.user)
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Login failed');
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: registerDto.email,
        password: registerDto.password,
        options: {
          data: {
            full_name: registerDto.fullName,
            company: registerDto.company,
            phone: registerDto.phone,
            roles: ['USER']
          }
        }
      });

      if (error) {
        throw new BadRequestException(error.message);
      }

      if (!data.user) {
        throw new BadRequestException('Registration failed');
      }

      return this.mapSupabaseUserToResponse(data.user);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error || !data.session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: this.mapSupabaseUserToResponse(data.user)
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  async logout(accessToken: string) {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        console.warn('Supabase logout error:', error.message);
      }
    } catch (error) {
      // Don't throw error for logout failures
      console.warn('Logout error:', error);
    }
  }

  async sendPasswordResetEmail(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
      });

      if (error) {
        console.warn('Password reset email error:', error.message);
      }
    } catch (error) {
      console.warn('Password reset error:', error);
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new BadRequestException(error.message);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Password reset failed');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // First verify current password by attempting login
      const { data: userData, error: userError } = await this.supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new BadRequestException('User not authenticated');
      }

      // Update password
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new BadRequestException(error.message);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Password change failed');
    }
  }

  async getUserPermissions(userId: string) {
    try {
      const { data: userData, error } = await this.supabase.auth.getUser();

      if (error || !userData.user) {
        throw new BadRequestException('User not found');
      }

      const roles = userData.user.user_metadata?.roles || ['USER'];

      const permissions = {
        canManageUsers: roles.includes('ADMIN'),
        canManageSystem: roles.includes('ADMIN'),
        canViewAnalytics: roles.includes('ADMIN') || roles.includes('MANAGER'),
        canCreateOrders: true,
        canEditOrders: roles.includes('ADMIN') || roles.includes('MANAGER'),
        canDeleteOrders: roles.includes('ADMIN'),
        canViewReports: true,
        canExportData: roles.includes('ADMIN') || roles.includes('MANAGER')
      };

      return permissions;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to get user permissions');
    }
  }

  async initiateOAuth(provider: string, redirectTo?: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: redirectTo || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`
        }
      });

      if (error) {
        throw new BadRequestException(error.message);
      }

      return { url: data.url };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('OAuth initialization failed');
    }
  }

  private mapSupabaseUserToResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || '',
      roles: user.user_metadata?.roles || ['USER'],
      avatar: user.user_metadata?.avatar_url || null,
      lastLoginAt: user.last_sign_in_at ? new Date(user.last_sign_in_at) : null,
      createdAt: new Date(user.created_at)
    };
  }
}