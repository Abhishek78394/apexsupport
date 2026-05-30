import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';

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

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: true })
  fullName: string;

  @Index({ unique: true })
  @Column({ length: 255 })
  email: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ select: false, nullable: true })
  passwordHash: string;

  @Index()
  @Column({ type: 'enum', enum: UserRole, default: UserRole.TENANT })
  role: UserRole;

  @Column({ type: 'jsonb', nullable: true })
  permissions: string[];

  @Index()
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  // Forgot password OTP
  @Column({ select: false, nullable: true })
  otp: string;

  @Column({ type: 'timestamptz', nullable: true })
  otpExpiresAt: Date;

  // Password reset token
  @Column({ select: false, nullable: true })
  resetToken: string;

  @OneToMany(() => Organization, (org) => org.owner, { cascade: true })
  organizations: Organization[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
