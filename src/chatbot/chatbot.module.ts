import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ChatbotConfig, ChatbotConfigSchema } from './entities/chatbot-config.entity';
import { Conversation, ConversationSchema } from '../conversation/entities/conversation.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatbotConfig.name, schema: ChatbotConfigSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  providers: [ChatbotService],
  controllers: [ChatbotController],
})
export class ChatbotModule {}
