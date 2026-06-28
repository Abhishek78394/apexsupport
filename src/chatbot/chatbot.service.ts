import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatbotConfig, ChatbotConfigDocument } from './entities/chatbot-config.entity';
import { ChatbotConfigDto } from './dto/chatbot-config.dto';
import { Conversation, ConversationDocument, ConversationStatus } from '../conversation/entities/conversation.entity';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

@Injectable()
export class ChatbotService {
  private genAI: GoogleGenerativeAI;

  constructor(
    @InjectModel(ChatbotConfig.name)
    private readonly configModel: Model<ChatbotConfigDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_API_KEY');
  }

  async createBot(organizationId: string, configDto: ChatbotConfigDto) {
    return this.configModel.create({ organizationId, ...configDto });
  }

  async findAll(organizationId: string) {
    return this.configModel.find({ organizationId }).exec();
  }

  async findOne(id: string, organizationId: string) {
    const bot = await this.configModel.findOne({ _id: id, organizationId }).exec();
    if (!bot) throw new NotFoundException('Chatbot not found');
    return bot;
  }

  async updateBot(id: string, organizationId: string, configDto: Partial<ChatbotConfigDto>) {
    const bot = await this.findOne(id, organizationId);
    Object.assign(bot, configDto);
    return bot.save();
  }

  async deleteBot(id: string, organizationId: string) {
    const bot = await this.findOne(id, organizationId);
    await bot.deleteOne();
    return { success: true };
  }

  async getMetrics(organizationId: string) {
    const bots = await this.findAll(organizationId);

    let totalConversations = 0;
    const conversationsPerBot: Record<string, { name: string; count: number }> = {};

    for (const bot of bots) {
      const count = await this.conversationModel.countDocuments({ chatbotId: bot.id }).exec();
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

    const tools: any = [];
    if (bot.allowedActions && bot.allowedActions.length > 0) {
      const functionDeclarations = bot.allowedActions.map((action) => ({
        name: action.name,
        description: action.description || `Execute ${action.name} action`,
        parameters: {
          type: SchemaType.OBJECT,
          properties: { parameters: { type: SchemaType.STRING, description: 'Additional parameters' } },
        },
      }));
      tools.push({ functionDeclarations });
    }

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      tools: tools.length > 0 ? tools : undefined,
    });

    const systemPrompt = `You are ${bot.name}, an AI assistant for a company. Your personality is ${bot.personality}.
    Company Knowledge Base:
    ${bot.systemKnowledge || 'No specific knowledge provided.'}
    
    Please respond to the user based on your personality and knowledge. Keep it helpful and concise.`;

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood.' }] },
      ],
    });

    const result = await chat.sendMessage(userMessage);
    let aiResponse = '';

    const calls =
      result.response.functionCalls && typeof result.response.functionCalls === 'function'
        ? result.response.functionCalls()
        : result.response.functionCalls;

    const functionCall = calls && calls[0];

    if (functionCall && bot.webhookUrl) {
      try {
        const webhookResponse = await fetch(bot.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: functionCall.name,
            args: functionCall.args,
            chatbotId: bot.id,
            organizationId,
          }),
        });

        const webhookData = await webhookResponse.json();

        const finalResult = await chat.sendMessage([
          {
            functionResponse: {
              name: functionCall.name,
              response: webhookData,
            },
          },
        ]);

        aiResponse = finalResult.response.text();
      } catch {
        aiResponse = `I tried to perform the action, but encountered an error connecting to the company's systems.`;
      }
    } else {
      aiResponse = result.response.text();
    }

    await this.conversationModel.create({
      organizationId,
      chatbotId: bot.id,
      status: ConversationStatus.RESOLVED,
      metadata: {
        lastUserMessage: userMessage,
        lastAiResponse: aiResponse,
        functionCalled: functionCall ? functionCall.name : null,
      },
    });

    return { response: aiResponse };
  }
}
