import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    // Extração e limpeza dos valores das variáveis de ambiente
    const host = 'smtp-relay.sendinblue.com'
    const port = 587
    const user = '83bbd6001@smtp-brevo.com'
    const pass = 'xsmtpsib-050ae1738b1b9c51f56fe6bb3b46ea07dcc29c807b115daac92e2c7e9de49e63-Ys8N3wJ6PvXLbK7M'

    // Criação do transportador com forçamento do método de autenticação para "LOGIN"
    this.transporter = nodemailer.createTransport({
      host, // ex.: smtp-relay.sendinblue.com
      port,
      secure: false, // false para a porta 587
      auth: {
        user,
        pass,
        authMethod: 'LOGIN', // Força o método de autenticação LOGIN
      },
      debug: false,
      logger: true,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: any[],
  ): Promise<void> {
    const from = 'suporte@nutriinteligente.online'
    const mailOptions = {
      from: `"Nutri Inteligente" <${from}>`,
      to,
      subject,
      html,
      attachments,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`E-mail enviado com sucesso: ${info.messageId}`);
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail', error);
      throw error;
    }
  }
}
