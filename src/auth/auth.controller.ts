import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('super-admin/login')
  @ApiOperation({ summary: 'API 1: Super Admin Login (30m JWT)' })
  superAdminLogin(@Body() loginDto: LoginDto) {
    return this.authService.superAdminLogin(loginDto);
  }

  @Post('tenant/login')
  @ApiOperation({ summary: 'API 2: Tenant Login (7d JWT)' })
  tenantLogin(@Body() loginDto: LoginDto) {
    return this.authService.tenantLogin(loginDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'API 7: Forgot Password (Send OTP)' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'API 8: Verify OTP (Returns Reset Token)' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'API 9: Set New Password' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
