import { Controller, Post, Body, Get, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { 
  LoginDto, 
  RegisterDto, 
  RefreshTokenDto, 
  ForgotPasswordDto, 
  ResetPasswordDto,
  ChangePasswordDto
} from '../dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(loginDto);
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user
      }
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      success: true,
      data: user,
      message: 'User registered successfully'
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = refreshTokenDto.refreshToken || req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return {
        success: false,
        error: 'Refresh token is required'
      };
    }

    try {
      const result = await this.authService.refreshToken(refreshToken);
      
      // Set new refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      return {
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user
        }
      };
    } catch (error) {
      // Clear invalid refresh token cookie
      res.clearCookie('refreshToken');
      
      return {
        success: false,
        error: 'Invalid refresh token'
      };
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      await this.authService.logout(token);
      res.clearCookie('refreshToken');
    }

    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.sendPasswordResetEmail(forgotPasswordDto.email);
    return {
      success: true,
      message: 'Password reset email sent'
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token, 
      resetPasswordDto.newPassword
    );
    return {
      success: true,
      message: 'Password reset successfully'
    };
  }

  @Get('me')
  async getProfile(@Req() req: Request) {
    // Extract user from request (set by auth middleware)
    const user = (req as any).user;
    return {
      success: true,
      data: user
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: Request,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    const userId = (req as any).user.id;
    await this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
    return {
      success: true,
      message: 'Password changed successfully'
    };
  }

  @Get('permissions')
  async getUserPermissions(@Req() req: Request) {
    const user = (req as any).user;
    const permissions = await this.authService.getUserPermissions(user.id);
    return {
      success: true,
      data: permissions
    };
  }

  // OAuth endpoints using Supabase
  @Get('google')
  async googleAuth(@Res() res: Response) {
    try {
      const result = await this.authService.initiateOAuth('google');

      if (result.url) {
        return res.redirect(result.url);
      }

      return res.status(400).json({
        success: false,
        error: 'No OAuth URL provided'
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || 'OAuth initialization failed'
      });
    }
  }

  @Get('google/callback')
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    // This endpoint is handled by Supabase directly
    // The frontend should handle the callback via Supabase client
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`);
  }
}