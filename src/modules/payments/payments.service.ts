import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { efipay } from '../../efipay';
import { PaymentStatus } from './dto/payment.dto';
import * as QRCode from 'qrcode';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Cria ou atualiza o registro de pagamento para o usuário.
   * Utiliza chargeInput para definir a expiração do QR Code na Efipay (300 segundos = 5 minutos).
   * Retorna o registro de pagamento, a imagem do QR Code (Data URL) e o valor do "copia e cola" PIX.
   *
   * Mesmo que exista um pagamento pendente, a API da Efipay será chamada para gerar novos dados.
   */
  async createPayment(userId: string): Promise<any> {
    try {
      // Verifica se o usuário existe
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('Usuário não encontrado');
      }

      // Configura o chargeInput com expiração definida para 300 segundos (5 minutos)
      const chargeInput = {
        calendario: { expiracao: 300 },
        valor: { original: '0.01' },
        chave: process.env.EFI_PAY_CHAVE || '',
        solicitacaoPagador: userId,
      };

      // Chama a API do Efipay utilizando o chargeInput
      const efipayResponse = await efipay.pixCreateImmediateCharge({}, chargeInput);
      this.logger.debug('Resposta da Efipay: ' + JSON.stringify(efipayResponse));

      // Extrai os valores do QR Code e do "copia e cola"
      const qrCodeText = efipayResponse.qrCode || efipayResponse.pixCopiaECola;
      const pixCopiaECola = efipayResponse.pixCopiaECola;
      if (!efipayResponse || !qrCodeText) {
        throw new InternalServerErrorException('Resposta inválida da Efipay, sem QR Code');
      }

      // Gera a imagem do QR Code (Data URL) a partir do valor obtido
      const qrCodeImage = await QRCode.toDataURL(qrCodeText);

      // Cria ou atualiza o registro de pagamento, definindo o status como PENDING
      const payment = await this.prisma.payment.upsert({
        where: { userId },
        update: { status: PaymentStatus.PENDING },
        create: {
          user: { connect: { id: userId } },
          status: PaymentStatus.PENDING,
        },
      });

      // Retorna o registro de pagamento, a imagem do QR Code e o valor do "copia e cola" PIX
      return { payment, qrCode: qrCodeImage, pixCopiaECola };
    } catch (error) {
      this.logger.error('Erro ao criar pagamento:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status do pagamento para COMPLETED e envia um e-mail de confirmação para o usuário.
   */
  async confirmPayment(userId: string): Promise<any> {
    try {
      // Verifica se existe um registro de pagamento
      const payment = await this.prisma.payment.findUnique({ where: { userId } });
      if (!payment) {
        throw new BadRequestException('Registro de pagamento não encontrado');
      }

      // Atualiza o status do pagamento para COMPLETED
      const updatedPayment = await this.prisma.payment.update({
        where: { userId },
        data: { status: PaymentStatus.COMPLETED },
      });

      // Recupera os dados do usuário para obter o e-mail
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user && user.email) {
        const subject = 'Pagamento Confirmado';
        const html = `
          <p>Olá, ${user.name || 'usuário'},</p>
          <p>Seu pagamento foi confirmado com sucesso!</p>
          <p>Entre em contato: wa.me/5524999304316</p>
          <p>Obrigado por utilizar nossos serviços.</p>
        `;
        await this.emailService.sendEmail(user.email, subject, html);
        this.logger.log(`E-mail de confirmação enviado para ${user.email}`);
      } else {
        this.logger.warn(`E-mail não encontrado para o usuário com id ${userId}`);
      }

      return updatedPayment;
    } catch (error) {
      this.logger.error('Erro ao confirmar pagamento:', error);
      throw error;
    }
  }

  /**
   * Retorna o status do pagamento para o usuário informado.
   */
  async getPaymentStatus(userId: string): Promise<{ status: string }> {
    const payment = await this.prisma.payment.findUnique({ where: { userId } });
    if (!payment) {
      throw new BadRequestException('Registro de pagamento não encontrado');
    }
    return { status: payment.status };
  }

  /**
   * Processa o webhook da Efipay para atualizar (ou criar) o registro de pagamento
   * com base nos dados da transação recebida.
   * Nota: Esse método utiliza o campo solicitacaoPagador (do chargeDetails) para identificar o usuário.
   */
  async processEfiWebhookPix(body: any): Promise<any> {
    try {
      this.logger.log('🔔 Webhook da Efipay recebido: ' + JSON.stringify(body, null, 2));
      const txid = body.pix[0].txid;
      this.logger.debug(`txid recebido: ${txid}`);

      const chargeDetails = await efipay.pixDetailCharge({ txid });
      this.logger.debug(`Detalhes da cobrança: ${JSON.stringify(chargeDetails)}`);

      const statusNormalizado = chargeDetails.status.toUpperCase().trim();
      this.logger.debug(`Status normalizado: ${statusNormalizado}`);

      // Identifica o usuário a partir do campo solicitacaoPagador
      const userId = chargeDetails.solicitacaoPagador;

      // Busca e atualiza (ou cria) o registro de pagamento
      const existingPayment = await this.prisma.payment.findUnique({ where: { userId } });
      if (existingPayment) {
        await this.prisma.payment.update({
          where: { userId },
          data: { status: statusNormalizado },
        });
        this.logger.log(`✅ Pagamento do usuário ${userId} atualizado para ${statusNormalizado} no banco.`);
      } else {
        await this.prisma.payment.create({
          data: {
            user: { connect: { id: userId } },
            status: statusNormalizado,
          },
        });
        this.logger.log(`✅ Pagamento do usuário ${userId} criado com status ${statusNormalizado} no banco.`);
      }

      return { message: 'Webhook processado com sucesso' };
    } catch (error) {
      this.logger.error('Erro no processEfiWebhookPix', error);
      throw new HttpException('Erro ao processar webhook Efipay', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
