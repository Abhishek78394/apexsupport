import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatbotConfig } from './entities/chatbot-config.entity';
import { ChatbotConfigDto } from './dto/chatbot-config.dto';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectRepository(ChatbotConfig)
    private readonly configRepository: Repository<ChatbotConfig>,
  ) {}

  async configureBot(organizationId: string, configDto: ChatbotConfigDto) {
    let config = await this.configRepository.findOne({ where: { organizationId } });
    
    if (config) {
      Object.assign(config, configDto);
    } else {
      config = this.configRepository.create({ organizationId, ...configDto });
    }

    return this.configRepository.save(config);
  }
}
