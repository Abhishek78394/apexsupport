import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Organization } from './organization/entities/organization.entity';
import { User } from './user/entities/user.entity';
import { ChatbotIntent } from './chatbot/entities/chatbot-intent.entity';
import { Conversation } from './conversation/entities/conversation.entity';
import { ChatbotConfig } from './chatbot/entities/chatbot-config.entity';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { UserModule } from './user/user.module';
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Organization, User, ChatbotConfig, ChatbotIntent, Conversation],
      synchronize: false,
    }),
    AuthModule,
    TenantModule,
    UserModule,
    ChatbotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
