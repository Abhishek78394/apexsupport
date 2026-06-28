import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatbotConfig } from './entities/chatbot-config.entity';
import { ChatbotConfigDto } from './dto/chatbot-config.dto';
import { Conversation, ConversationStatus } from '../conversation/entities/conversation.entity';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

@Injectable()
export class ChatbotService {
  private genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(ChatbotConfig)
    private readonly configRepository: Repository<ChatbotConfig>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_API_KEY');
  }

  async createBot(organizationId: string, configDto: ChatbotConfigDto) {
    const config = this.configRepository.create({ organizationId, ...configDto });
    return this.configRepository.save(config);
  }

  async findAll(organizationId: string) {
    return this.configRepository.find({ where: { organizationId } });
  }

  async findOne(id: string, organizationId: string) {
    const bot = await this.configRepository.findOne({ where: { id, organizationId } });
    if (!bot) throw new NotFoundException('Chatbot not found');
    return bot;
  }

  async updateBot(id: string, organizationId: string, configDto: Partial<ChatbotConfigDto>) {
    const bot = await this.findOne(id, organizationId);
    Object.assign(bot, configDto);
    return this.configRepository.save(bot);
  }

  async deleteBot(id: string, organizationId: string) {
    const bot = await this.findOne(id, organizationId);
    await this.configRepository.remove(bot);
    return { success: true };
  }

  async getMetrics(organizationId: string) {
    const bots = await this.findAll(organizationId);
    const botIds = bots.map((b) => b.id);
    
    let totalConversations = 0;
    const conversationsPerBot: Record<string, { name: string; count: number }> = {};

    for (const bot of bots) {
      const count = await this.conversationRepository.count({ where: { chatbotId: bot.id } });
      conversationsPerBot[bot.id] = { name: bot.name, count };
      totalConversations += count;
    }

    return {
      totalActiveBots: bots.length,
      totalConversations,
      conversationsPerBot,
    };
  }

  async chatWithGemini(chatbotId: string, organizationId: string, userMessage: string) {
    const bot = await this.findOne(chatbotId, organizationId);

    // Prepare tools if allowedActions exist
    const tools: any = [];
    if (bot.allowedActions && bot.allowedActions.length > 0) {
      const functionDeclarations = bot.allowedActions.map(action => ({
        name: action.name,
        description: action.description || `Execute ${action.name} action`,
        parameters: { 
          type: SchemaType.OBJECT, 
          properties: { parameters: { type: SchemaType.STRING, description: 'Additional parameters' } } 
        }
      }));
      tools.push({ functionDeclarations });
    }

    const model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      tools: tools.length > 0 ? tools : undefined
    });

    const systemPrompt = `You are ${bot.name}, an AI assistant for a company. Your personality is ${bot.personality}.
    Company Knowledge Base:
    ${bot.systemKnowledge || 'No specific knowledge provided.'}
    
    Please respond to the user based on your personality and knowledge. Keep it helpful and concise.`;

    const chat = model.startChat({
      history: [{ role: 'user', parts: [{ text: systemPrompt }] }, { role: 'model', parts: [{ text: 'Understood.' }] }],
    });

    const result = await chat.sendMessage(userMessage);
    let aiResponse = '';
    
    // Check if Gemini wants to call a function
    const calls = result.response.functionCalls && typeof result.response.functionCalls === 'function' 
      ? result.response.functionCalls() 
      : result.response.functionCalls;
      
    const functionCall = calls && calls[0];
    
    if (functionCall && bot.webhookUrl) {
      // Execute the webhook
      try {
        const webhookResponse = await fetch(bot.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: functionCall.name,
            args: functionCall.args,
            chatbotId: bot.id,
            organizationId
          })
        });
        
        const webhookData = await webhookResponse.json();
        
        // Feed the result back to Gemini so it can answer the user
        const finalResult = await chat.sendMessage([{
          functionResponse: {
            name: functionCall.name,
            response: webhookData
          }
        }]);
        
        aiResponse = finalResult.response.text();
      } catch (error) {
        aiResponse = `I tried to perform the action, but encountered an error connecting to the company's systems.`;
      }
    } else {
      aiResponse = result.response.text();
    }

    // Log the conversation for metrics
    const conversation = this.conversationRepository.create({
      organizationId,
      chatbotId: bot.id,
      status: ConversationStatus.RESOLVED,
      metadata: { lastUserMessage: userMessage, lastAiResponse: aiResponse, functionCalled: functionCall ? functionCall.name : null },
    });
    await this.conversationRepository.save(conversation);

    return { response: aiResponse };
  }
}
