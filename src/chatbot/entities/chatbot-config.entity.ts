import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum BotPersonality {
  FRIENDLY = 'Friendly',
  FORMAL = 'Formal',
  PROFESSIONAL = 'Professional',
}

export enum AgentType {
  TEXT_CHATBOT = 'Text Chatbot',
  VOICE_AGENT = 'Voice Agent',
}

export type ChatbotConfigDocument = HydratedDocument<ChatbotConfig>;

@Schema({ timestamps: true, collection: 'chatbot_configs' })
export class ChatbotConfig {
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ type: String, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ type: String, enum: AgentType, default: AgentType.TEXT_CHATBOT })
  agentType: AgentType;

  @Prop({ required: true, maxlength: 100 })
  name: string;

  @Prop({ type: String, enum: BotPersonality, default: BotPersonality.PROFESSIONAL })
  personality: BotPersonality;

  @Prop()
  logoUrl?: string;

  @Prop({ type: Object })
  businessHours?: Record<string, unknown>;

  @Prop()
  systemKnowledge?: string;

  @Prop()
  webhookUrl?: string;

  @Prop({ type: [Object], default: [] })
  allowedActions?: Record<string, unknown>[];
}

export const ChatbotConfigSchema = SchemaFactory.createForClass(ChatbotConfig);
