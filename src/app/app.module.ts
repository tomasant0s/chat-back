import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from 'src/config/configuration';
import { EmailModule } from 'src/email/email.module';
import { BotModule } from 'src/modules/bot/bot.module';
import { PaymentsModule } from 'src/modules/payments/payments.module';
import { UsersModule } from 'src/modules/users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    PaymentsModule,
    BotModule,
    EmailModule,
  ],
})
export class AppModule {}
