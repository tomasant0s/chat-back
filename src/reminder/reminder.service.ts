// src/reminder/reminder.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as dayjs from 'dayjs';
import { BotService } from 'src/modules/bot/bot.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private prisma: PrismaService,
    private botService: BotService,
  ) {}

  // Executa a cada minuto para verificar os lembretes agendados
  @Cron(CronExpression.EVERY_MINUTE)
  async handleReminders() {
    const now = dayjs();
    this.logger.log(`Verificando lembretes em ${now.format('DD/MM/YYYY HH:mm')}`);
    
    const dueReminders = await this.prisma.reminder.findMany({
      where: {
        active: true,
        scheduledAt: { lte: now.toDate() },
      },
    });

    for (const reminder of dueReminders) {
      // Busca o usuário para obter o telefone
      const user = await this.prisma.user.findUnique({ where: { id: reminder.userId } });
      if (user) {
        const message = `Lembrete: ${reminder.description}`;
        await this.botService.sendWhatsAppMessage(user.phone, message);
        this.logger.log(`Lembrete enviado para ${user.phone}: ${message}`);

        if (reminder.recurrence) {
          // Se o lembrete for recorrente, atualiza para a próxima ocorrência
          let nextScheduledAt: Date;
          if (reminder.recurrence === 'weekly') {
            nextScheduledAt = dayjs(reminder.scheduledAt).add(1, 'week').toDate();
          } else if (reminder.recurrence === 'monthly') {
            nextScheduledAt = dayjs(reminder.scheduledAt).add(1, 'month').toDate();
          } else {
            // Caso haja outros tipos de recorrência, você pode tratá-los aqui
            nextScheduledAt = dayjs(reminder.scheduledAt).add(1, 'day').toDate();
          }
          await this.prisma.reminder.update({
            where: { id: reminder.id },
            data: { scheduledAt: nextScheduledAt },
          });
        } else {
          // Se não for recorrente, remove o lembrete do banco
          await this.prisma.reminder.delete({
            where: { id: reminder.id },
          });
        }
      }
    }
  }
}
