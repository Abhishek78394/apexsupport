import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { IndustryType } from '../../organization/entities/organization.entity';

export class RegisterTenantDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'tenant@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'StrongP@ssw0rd!' })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Password too weak' })
  password: string;

  @ApiProperty({ example: 'Tech Solutions Inc' })
  @IsString()
  @IsNotEmpty()
  orgName: string;

  @ApiProperty({ example: 'tech-solutions' })
  @IsString()
  @IsNotEmpty()
  orgSlug: string;

  @ApiProperty({ enum: IndustryType, example: IndustryType.SAAS })
  @IsEnum(IndustryType)
  industry: IndustryType;

  @ApiPropertyOptional({ example: '50-200' })
  @IsString()
  @IsOptional()
  companySize?: string;

  @ApiPropertyOptional({ example: 'https://techsolutions.com' })
  @IsString()
  @IsOptional()
  websiteUrl?: string;
}
