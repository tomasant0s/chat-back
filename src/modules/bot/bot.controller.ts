import { Controller, Post, Body } from '@nestjs/common';
import { BotService } from './bot.service';

@Controller('bot')
export class BotController {
  constructor(private botService: BotService) {}

  // Endpoint para simular o recebimento de mensagem do WhatsApp
  @Post('message')
  async receiveMessage(
    @Body('phone') phone: string,
    @Body('message') message: string,
  ): Promise<{ response: string }> {
    const response = await this.botService.processMessage(phone, message);
    return { response };
  }
}
