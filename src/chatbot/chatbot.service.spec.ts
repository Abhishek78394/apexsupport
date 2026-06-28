import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ChatbotService } from './chatbot.service';
import { ChatbotConfig, BotPersonality, AgentType } from './entities/chatbot-config.entity';
import { Conversation } from '../conversation/entities/conversation.entity';

const mockConfigModel = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockConversationModel = {
  create: jest.fn(),
  countDocuments: jest.fn(),
};

global.fetch = jest.fn() as jest.Mock;

const mockSendMessage = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  startChat: jest.fn().mockReturnValue({
    sendMessage: mockSendMessage,
  }),
});

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: mockGetGenerativeModel,
      };
    }),
    SchemaType: {
      OBJECT: 'object',
      STRING: 'string',
    },
  };
});

describe('ChatbotService', () => {
  let service: ChatbotService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        {
          provide: getModelToken(ChatbotConfig.name),
          useValue: mockConfigModel,
        },
        {
          provide: getModelToken(Conversation.name),
          useValue: mockConversationModel,
        },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
  });

  it('Test 1: Should successfully create a new ChatbotConfig', async () => {
    const dto = { name: 'TestBot', personality: BotPersonality.PROFESSIONAL, agentType: AgentType.TEXT_CHATBOT };
    const savedBot = { id: 'bot-123', organizationId: 'org-1', ...dto };

    mockConfigModel.create.mockResolvedValue(savedBot);

    const result = await service.createBot('org-1', dto as any);
    expect(result.id).toEqual('bot-123');
    expect(mockConfigModel.create).toHaveBeenCalled();
  });

  it('Test 2: Should aggregate and return chatbot subscription metrics correctly', async () => {
    const mockBots = [
      { id: 'bot-1', _id: 'bot-1', name: 'Public Bot' },
      { id: 'bot-2', _id: 'bot-2', name: 'Internal Bot' },
    ];
    mockConfigModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockBots) });
    mockConversationModel.countDocuments
      .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(150) })
      .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(45) });

    const metrics = await service.getMetrics('org-1');

    expect(metrics.totalActiveBots).toBe(2);
    expect(metrics.totalConversations).toBe(195);
    expect(metrics.conversationsPerBot['bot-1'].count).toBe(150);
  });

  it('Test 3: Gemini Chat - Should return standard text response when no action is needed', async () => {
    const mockBot = { id: 'bot-1', name: 'Support', personality: BotPersonality.FRIENDLY };
    mockConfigModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockBot) });

    mockSendMessage.mockResolvedValue({
      response: {
        text: () => 'Hello! How can I help you?',
        functionCalls: () => undefined,
      },
    });

    const result = await service.chatWithGemini('bot-1', 'org-1', 'Hi there!');

    expect(result.response).toEqual('Hello! How can I help you?');
    expect(mockConversationModel.create).toHaveBeenCalled();
  });

  it('Test 4: Gemini Chat - Dynamic Action - Should execute CANCEL_ORDER webhook', async () => {
    const mockBot = {
      id: 'bot-1',
      _id: 'bot-1',
      name: 'E-commerce Bot',
      webhookUrl: 'https://api.tenant.com/webhook',
      allowedActions: [{ name: 'CANCEL_ORDER', description: 'Cancels an order' }],
    };
    mockConfigModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockBot) });

    mockSendMessage.mockResolvedValueOnce({
      response: {
        text: () => '',
        functionCalls: () => [{ name: 'CANCEL_ORDER', args: { orderId: '999' } }],
      },
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ success: true, message: 'Order 999 canceled' }),
    });

    mockSendMessage.mockResolvedValueOnce({
      response: {
        text: () => 'I have successfully canceled your order 999.',
        functionCalls: () => undefined,
      },
    });

    const result = await service.chatWithGemini('bot-1', 'org-1', 'Cancel order 999');

    expect(global.fetch).toHaveBeenCalledWith('https://api.tenant.com/webhook', expect.any(Object));
    expect(result.response).toEqual('I have successfully canceled your order 999.');
  });

  it('Test 5: Gemini Chat - Dynamic Action - Should execute BOOK_APPOINTMENT webhook', async () => {
    const mockBot = {
      id: 'bot-2',
      _id: 'bot-2',
      name: 'Clinic Bot',
      webhookUrl: 'https://api.clinic.com/webhook',
      allowedActions: [{ name: 'BOOK_APPOINTMENT', description: 'Books a doctor appointment' }],
    };
    mockConfigModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockBot) });

    mockSendMessage.mockResolvedValueOnce({
      response: {
        text: () => '',
        functionCalls: () => [{ name: 'BOOK_APPOINTMENT', args: { date: '2026-10-15', doctor: 'Dr. Smith' } }],
      },
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ success: true, confirmation: 'APT-1234' }),
    });

    mockSendMessage.mockResolvedValueOnce({
      response: {
        text: () => 'Your appointment with Dr. Smith is booked for 2026-10-15.',
        functionCalls: () => undefined,
      },
    });

    const result = await service.chatWithGemini('bot-2', 'org-1', 'Book me with Dr. Smith on Oct 15th 2026');

    const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchArgs[0]).toEqual('https://api.clinic.com/webhook');
    expect(JSON.parse(fetchArgs[1].body).action).toEqual('BOOK_APPOINTMENT');
    expect(result.response).toEqual('Your appointment with Dr. Smith is booked for 2026-10-15.');
  });

  it('Test 6: Gemini Chat - Webhook Failure Handling - Should fail gracefully', async () => {
    const mockBot = {
      id: 'bot-3',
      _id: 'bot-3',
      webhookUrl: 'https://api.broken.com/webhook',
      allowedActions: [{ name: 'APPROVE_REFUND' }],
    };
    mockConfigModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockBot) });

    mockSendMessage.mockResolvedValueOnce({
      response: {
        text: () => '',
        functionCalls: () => [{ name: 'APPROVE_REFUND', args: { amount: '50' } }],
      },
    });

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection timeout'));

    const result = await service.chatWithGemini('bot-3', 'org-1', 'Approve the $50 refund');

    expect(result.response).toContain('encountered an error connecting to the company');
  });
});
