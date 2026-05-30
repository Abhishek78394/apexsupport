import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ChatbotConfig } from './entities/chatbot-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatbotConfig])],
  providers: [ChatbotService],
  controllers: [ChatbotController]
})
export class ChatbotModule {}
