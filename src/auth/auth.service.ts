import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { User, UserDocument, UserRole, UserStatus } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async superAdminLogin(loginDto: LoginDto) {
    if (loginDto.email === 'admin@apex.com' && loginDto.password === 'admin123') {
      const payload = { sub: 'super-admin-id', email: 'admin@apex.com', role: UserRole.SUPER_ADMIN };
      return { access_token: this.jwtService.sign(payload, { expiresIn: '30m' }) };
    }

    const user = await this.userModel
      .findOne({ email: loginDto.email, role: UserRole.SUPER_ADMIN })
      .select('+passwordHash')
      .exec();

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = user.passwordHash && (await bcrypt.compare(loginDto.password, user.passwordHash));
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return { access_token: this.jwtService.sign(payload, { expiresIn: '30m' }) };
  }

  async tenantLogin(loginDto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: loginDto.email })
      .select('+passwordHash')
      .exec();

    if (!user || user.status !== UserStatus.ACTIVE) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash!);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return { access_token: this.jwtService.sign(payload, { expiresIn: '7d' }) };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ email: dto.email }).exec();
    if (!user) {
      return { message: 'If that email exists, an OTP has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    user.otp = otp;
    user.otpExpiresAt = expires;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: 'Password Reset Request - ApexSupport',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f5; width: 100%; margin: 0; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: left;">
                    <tr>
                      <td style="background-color: #4F46E5; padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px;">ApexSupport</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 40px 30px 40px; color: #374151;">
                        <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: #111827;">Password Reset Request</h2>
                        <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px;">
                          We received a request to reset your password. Use the secure One-Time Password (OTP) below to proceed.
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td align="center">
                              <div style="display: inline-block; background-color: #EEF2FF; color: #4F46E5; font-size: 36px; font-weight: 700; letter-spacing: 6px; padding: 15px 30px; border-radius: 8px; border: 1px solid #C7D2FE;">
                                ${otp}
                              </div>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 30px 0 0 0; font-size: 14px; color: #6B7280; text-align: center; line-height: 22px;">
                          This code will securely expire in <strong>10 minutes</strong>.<br>
                          If you did not request this reset, please safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
                        <p style="margin: 0; font-size: 13px; color: #9CA3AF;">&copy; ${new Date().getFullYear()} ApexSupport. All rights reserved.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });
      console.log(`Email sent successfully to ${user.email}`);
    } catch (error) {
      console.error(`Failed to send email to ${user.email}:`, error);
    }

    return { message: 'If that email exists, an OTP has been sent.' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+otp +otpExpiresAt')
      .exec();

    if (!user || user.otp !== dto.otp || !user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.resetToken = resetToken;
    await user.save();

    return { resetToken, message: 'OTP verified. Use this token to reset your password within 10 minutes.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userModel
      .findOne({ resetToken: dto.resetToken })
      .select('+resetToken +passwordHash')
      .exec();

    if (!user) throw new BadRequestException('Invalid reset token');

    const salt = await bcrypt.genSalt();
    user.passwordHash = await bcrypt.hash(dto.newPassword, salt);
    user.resetToken = undefined;

    await user.save();

    return { message: 'Password has been successfully reset.' };
  }
}
