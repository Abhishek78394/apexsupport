import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';
import { Organization } from '../organization/entities/organization.entity';
import { RegisterTenantDto } from './dto/register-tenant.dto';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
  ) {}

  async register(dto: RegisterTenantDto, isAdminCreated: boolean = false) {
    const existingUser = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existingUser) throw new BadRequestException('Email already in use');

    const existingOrg = await this.orgRepository.findOne({ where: { slug: dto.orgSlug } });
    if (existingOrg) throw new BadRequestException('Organization slug already in use');

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: UserRole.TENANT,
      status: UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);

    const org = this.orgRepository.create({
      name: dto.orgName,
      slug: dto.orgSlug,
      industry: dto.industry,
      companySize: dto.companySize,
      websiteUrl: dto.websiteUrl,
      ownerId: savedUser.id,
    });

    await this.orgRepository.save(org);

    // Send Welcome Email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    let html = `
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
                    <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 600; color: #111827;">Welcome to ApexSupport!</h2>
                    <p style="margin: 0 0 10px 0; font-size: 16px; line-height: 24px;">
                      Hi <strong>${dto.fullName}</strong>,
                    </p>
                    <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px;">
                      Your account for <strong style="color: #4F46E5;">${dto.orgName}</strong> has been successfully created and your workspace is now active.
                    </p>
    `;

    if (isAdminCreated) {
      html += `
                    <div style="background-color: #F3F4F6; border-left: 4px solid #4F46E5; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #4B5563;">An administrator has set up this account for you. Here are your temporary credentials:</p>
                      <p style="margin: 0 0 5px 0; font-size: 15px;"><strong>Email:</strong> ${dto.email}</p>
                      <p style="margin: 0; font-size: 15px;"><strong>Password:</strong> ${dto.password}</p>
                    </div>
                    <p style="margin: 0; font-size: 14px; color: #DC2626;">
                      <em>⚠️ Please log in and change your password immediately to secure your account.</em>
                    </p>
      `;
    } else {
      html += `
                    <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
                      <p style="margin: 0; font-size: 15px; color: #065F46;">Thank you for registering! You can now log in using the email and password you just created.</p>
                    </div>
      `;
    }

    html += `
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
    `;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: savedUser.email,
        subject: 'Welcome to ApexSupport!',
        html,
      });
      console.log(`Welcome email sent to ${savedUser.email}`);
    } catch (e) {
      console.error(`Failed to send welcome email to ${savedUser.email}`, e);
    }

    return { message: 'Tenant and Organization created successfully', tenantId: savedUser.id, orgId: org.id };
  }

  async updateTenant(id: string, updateData: any) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Tenant not found');
    
    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async suspendTenant(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Tenant not found');

    user.status = UserStatus.SUSPENDED;
    await this.userRepository.save(user);
    return { message: 'Tenant suspended successfully' };
  }

  async findAll() {
    return this.userRepository.find({
      where: { role: UserRole.TENANT },
      relations: { organizations: true },
      select: { id: true, fullName: true, email: true, phone: true, status: true, createdAt: true },
    });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id, role: UserRole.TENANT },
      relations: { organizations: true },
      select: { id: true, fullName: true, email: true, phone: true, status: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('Tenant not found');
    return user;
  }
}
