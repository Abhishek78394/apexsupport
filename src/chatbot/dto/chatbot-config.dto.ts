import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';
import { BotPersonality, AgentType } from '../entities/chatbot-config.entity';

export class ChatbotConfigDto {
  @ApiProperty({ example: 'Aria' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: BotPersonality, example: BotPersonality.FRIENDLY })
  @IsEnum(BotPersonality)
  personality: BotPersonality;

  @ApiProperty({ enum: AgentType, example: AgentType.TEXT_CHATBOT })
  @IsEnum(AgentType)
  agentType: AgentType;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ example: { timezone: 'UTC', monday: '9-5' } })
  @IsObject()
  @IsOptional()
  businessHours?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Our company has a strict 30-day refund policy.' })
  @IsString()
  @IsOptional()
  systemKnowledge?: string;

  @ApiPropertyOptional({ example: 'https://api.mycompany.com/webhook' })
  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @ApiPropertyOptional({ example: [{ name: 'CANCEL_ORDER', description: 'Cancels a user order' }] })
  @IsOptional()
  allowedActions?: Record<string, any>[];
}
