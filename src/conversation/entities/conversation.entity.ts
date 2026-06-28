import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum ConversationStatus {
  OPEN = 'Open',
  RESOLVED = 'Resolved',
  ESCALATED = 'Escalated',
}

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ type: String, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ type: String, ref: 'ChatbotConfig', required: true, index: true })
  chatbotId: string;

  @Prop({ type: String, ref: 'User', index: true })
  assignedAgentId?: string;

  @Prop({ type: String, enum: ConversationStatus, default: ConversationStatus.OPEN, index: true })
  status: ConversationStatus;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
