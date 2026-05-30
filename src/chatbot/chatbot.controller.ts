import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatbotConfigDto } from './dto/chatbot-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Chatbot Management (Tenant Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('config')
  @ApiOperation({ summary: 'Step 1 Onboarding: Configure bot personality and settings' })
  @ApiResponse({ status: 201, description: 'Bot configured successfully.' })
  configureBot(@Request() req: any, @Body() configDto: ChatbotConfigDto) {
    return this.chatbotService.configureBot(req.user.organizationId, configDto);
  }
}
