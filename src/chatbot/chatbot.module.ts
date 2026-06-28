import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ChatbotConfig } from './entities/chatbot-config.entity';
import { Conversation } from '../conversation/entities/conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatbotConfig, Conversation])],
  providers: [ChatbotService],
  controllers: [ChatbotController]
})
export class ChatbotModule {}
