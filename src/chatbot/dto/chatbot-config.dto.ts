import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';
import { BotPersonality } from '../entities/chatbot-config.entity';

export class ChatbotConfigDto {
  @ApiProperty({ example: 'Aria' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: BotPersonality, example: BotPersonality.FRIENDLY })
  @IsEnum(BotPersonality)
  personality: BotPersonality;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ example: { timezone: 'UTC', monday: '9-5' } })
  @IsObject()
  @IsOptional()
  businessHours?: Record<string, any>;
}
