import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT = 'TENANT',
}

export enum UserStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  DEACTIVATED = 'Deactivated',
}

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ maxlength: 255 })
  fullName?: string;

  @Prop({ required: true, unique: true, maxlength: 255 })
  email: string;

  @Prop({ maxlength: 50 })
  phone?: string;

  @Prop({ select: false })
  passwordHash?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.TENANT })
  role: UserRole;

  @Prop({ type: [String], default: [] })
  permissions?: string[];

  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop({ select: false })
  otp?: string;

  @Prop()
  otpExpiresAt?: Date;

  @Prop({ select: false })
  resetToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
