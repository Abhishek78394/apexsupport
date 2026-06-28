import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { User, UserDocument, UserRole, UserStatus } from '../user/entities/user.entity';
import { Organization, OrganizationDocument } from '../organization/entities/organization.entity';
import { RegisterTenantDto } from './dto/register-tenant.dto';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Organization.name)
    private readonly orgModel: Model<OrganizationDocument>,
  ) {}

  async register(dto: RegisterTenantDto, isAdminCreated: boolean = false) {
    const existingUser = await this.userModel.findOne({ email: dto.email }).exec();
    if (existingUser) throw new BadRequestException('Email already in use');

    const existingOrg = await this.orgModel.findOne({ slug: dto.orgSlug }).exec();
    if (existingOrg) throw new BadRequestException('Organization slug already in use');

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const savedUser = await this.userModel.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: UserRole.TENANT,
      status: UserStatus.ACTIVE,
    });

    const org = await this.orgModel.create({
      name: dto.orgName,
      slug: dto.orgSlug,
      industry: dto.industry,
      companySize: dto.companySize,
      websiteUrl: dto.websiteUrl,
      ownerId: savedUser.id,
    });

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

  async updateTenant(id: string, updateData: Record<string, unknown>) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('Tenant not found');

    Object.assign(user, updateData);
    return user.save();
  }

  async suspendTenant(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('Tenant not found');

    user.status = UserStatus.SUSPENDED;
    await user.save();
    return { message: 'Tenant suspended successfully' };
  }

  async findAll() {
    const users = await this.userModel
      .find({ role: UserRole.TENANT })
      .select('fullName email phone status createdAt')
      .exec();

    return Promise.all(
      users.map(async (user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        status: user.status,
        createdAt: user.createdAt,
        organizations: await this.orgModel.find({ ownerId: user.id }).exec(),
      })),
    );
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findOne({ _id: id, role: UserRole.TENANT })
      .select('fullName email phone status createdAt')
      .exec();

    if (!user) throw new NotFoundException('Tenant not found');

    const organizations = await this.orgModel.find({ ownerId: user.id }).exec();

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt,
      organizations,
    };
  }
}
