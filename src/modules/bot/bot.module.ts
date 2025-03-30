import { Module } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReminderService } from 'src/reminder/reminder.service';

@Module({
  imports: [UsersModule, PrismaModule],
  controllers: [BotController],
  providers: [BotService, ReminderService],
})
export class BotModule {}
