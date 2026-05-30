import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Organization } from './src/organization/entities/organization.entity';
import { User } from './src/user/entities/user.entity';
import { ChatbotConfig } from './src/chatbot/entities/chatbot-config.entity';
import { ChatbotIntent } from './src/chatbot/entities/chatbot-intent.entity';
import { Conversation } from './src/conversation/entities/conversation.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Organization, User, ChatbotConfig, ChatbotIntent, Conversation],
  migrations: ['./src/migrations/*.ts'],
  synchronize: false,
});
