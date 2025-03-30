import { Controller, Get, Param, Post, ParseUUIDPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // Endpoint para gerar o QR Code de pagamento
  @Post('create/:userId')
  async createPayment(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<PaymentDto> {
    return await this.paymentsService.createPayment(userId);
  }
  
  // Endpoint chamado pelo webhook do Efipay para confirmar o pagamento
  @Post('webhook/:userId')
  async paymentWebhook(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<{ message: string; payment: PaymentDto }> {
    const payment = await this.paymentsService.confirmPayment(userId);
    return { message: 'Pagamento confirmado', payment };
  }

  // Endpoint para obter o status do pagamento
  @Get('status/:userId')
  async getPaymentStatus(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<{ status: string }> {
    return await this.paymentsService.getPaymentStatus(userId);
  }
}
