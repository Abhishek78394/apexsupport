import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChatbotIntentDocument = HydratedDocument<ChatbotIntent>;

@Schema({ timestamps: true, collection: 'chatbot_intents' })
export class ChatbotIntent {
  @Prop({ required: true, maxlength: 100 })
  name: string;

  @Prop({ type: [String], default: [] })
  trainingPhrases?: string[];

  @Prop({ type: Object })
  responseTemplate?: Record<string, unknown>;

  @Prop({ type: String, ref: 'Organization', required: true, index: true })
  organizationId: string;
}

export const ChatbotIntentSchema = SchemaFactory.createForClass(ChatbotIntent);

ChatbotIntentSchema.index({ organizationId: 1, name: 1 }, { unique: true });
