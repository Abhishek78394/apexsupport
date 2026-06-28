import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatbotConfigDto } from './dto/chatbot-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Chatbot Management (Tenant)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/chatbots')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new AI Agent (Text/Voice)' })
  createBot(@Request() req: any, @Body() configDto: ChatbotConfigDto) {
    return this.chatbotService.createBot(req.user.organizationId, configDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all active agents' })
  findAll(@Request() req: any) {
    return this.chatbotService.findAll(req.user.organizationId);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get chatbot usage and conversation metrics for subscription billing' })
  getMetrics(@Request() req: any) {
    return this.chatbotService.getMetrics(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific AI agent' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.chatbotService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update AI agent configuration' })
  updateBot(@Request() req: any, @Param('id') id: string, @Body() configDto: Partial<ChatbotConfigDto>) {
    return this.chatbotService.updateBot(id, req.user.organizationId, configDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an AI agent' })
  deleteBot(@Request() req: any, @Param('id') id: string) {
    return this.chatbotService.deleteBot(id, req.user.organizationId);
  }

  @Post(':id/chat')
  @ApiOperation({ summary: 'Simulate a conversation with the AI Agent via Gemini' })
  chat(@Request() req: any, @Param('id') id: string, @Body('message') message: string) {
    return this.chatbotService.chatWithGemini(id, req.user.organizationId, message);
  }
}
