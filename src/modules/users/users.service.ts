import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const { name, phone, email } = createUserDto;
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { name, phone, email },
      });
    }
    return user;
  }

  async getUserByPhone(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async updateUserBudget(userId: string, budget: number) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { monthlyBudget: budget },
    });
  }
  
  async hasUserPaid(userId: string): Promise<boolean> {
    const payment = await this.prisma.payment.findUnique({ where: { userId } });
    return payment ? payment.status === 'COMPLETED' : false;
  }
}
