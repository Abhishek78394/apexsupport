import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'superadmin@yourplatform.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secure_password_here' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
