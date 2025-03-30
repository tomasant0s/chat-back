// src/bot/bot.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { create, Whatsapp } from 'venom-bot';
import dayjs = require('dayjs');
import isBetween = require('dayjs/plugin/isBetween');
import 'dayjs/locale/pt-br';
dayjs.extend(isBetween);
dayjs.locale('pt-br');

import { categorizeExpense, normalizeText } from 'src/utils/categorize-expense.util';

@Injectable()
export class BotService {
  private client: Whatsapp;
  private readonly logger = new Logger(BotService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {
    create(
      'chat-bot-session',
      (base64QrImg: string, asciiQR: string, attempts: number, urlCode: string) => {
        this.logger.log('QR Code gerado: ' + asciiQR);
      },
      (statusSession: string, session: string) => {
        this.logger.log('Status da sessão: ' + statusSession);
      },
      { headless: true } as any
    )
      .then((client: Whatsapp) => {
        this.client = client;
        this.logger.log('Cliente do WhatsApp inicializado');
        this.client.onMessage(async (message) => {
          this.logger.log(`Mensagem recebida de ${message.from}: ${message.body}`);
          try {
            const response = await this.processMessage(message.from, message.body);
            if (response) {
              this.logger.log(`Enviando resposta para ${message.from}: ${response}`);
              await this.sendWhatsAppMessage(message.from, response);
            } else {
              this.logger.log(`Nenhuma resposta enviada para ${message.from} (usuário não encontrado ou mensagem irrelevante)`);
            }
          } catch (error) {
            this.logger.error('Erro ao processar mensagem', error);
          }
        });
      })
      .catch((error) =>
        this.logger.error('Erro ao inicializar o venom-bot:', error)
      );
  }

  async processMessage(phone: string, message: string): Promise<string> {
    const normalizedPhone = phone.split('@')[0];
    const user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });
    
    // Ignora mensagens de usuários não cadastrados
    if (!user) {
      return '';
    }
    
    // Verifica se o pagamento foi concluído
    const payment = await this.prisma.payment.findUnique({
      where: { userId: user.id },
    });
    if (!payment || payment.status !== 'COMPLETED') {
      return 'Para utilizar o serviço, é necessário que seu pagamento seja finalizado. Por favor, verifique e complete o pagamento.';
    }

    const msg = message.toLowerCase().trim();

    if (/^(oi|olá|e aí|bom dia|boa tarde|boa noite)[!.]?$/i.test(msg)) {
      return `Olá! Eu sou o seu assistente financeiro 🤖💰. Posso te ajudar a:
• Registrar seus gastos 📝
• Listar seus gastos por período 📆
• Gerar relatórios detalhados com resumos e top itens 📊
• Criar lembretes para suas contas ⏰
• Consultar seu saldo e definir seu orçamento 🎯

Se precisar de ajuda, digite /ajuda. Estou aqui para facilitar sua vida! 😉`;
    }

    if (/gastei\s+/.test(msg) || /fiz(?:\s+um)?\s+gasto/.test(msg)) {
      return await this.handleRegisterExpense(user.id, message);
    }
    if (/\/gastos\b/.test(msg) || /(listar|mostrar|meus).*(gasto)/.test(msg)) {
      return await this.handleListExpenses(user.id, message);
    }
    if (/\/relatorio\b/.test(msg) || /(relat[oó]rio|quanto\s+gastei)/.test(msg)) {
      return await this.handleGenerateReport(user.id, message);
    }
    if (/\/lembrete|adiciona(?:r)?\s+lembrete|cadastra(?:r)?\s+lembrete|criar(?:\s+um)?\s+lembrete/i.test(msg)) {
      return await this.handleAddReminder(user.id, message);
    }
    if (/(quais são|listar|mostrar).*(lembrete)/.test(msg)) {
      return await this.listReminders(user.id);
    }
    if (/(apaga|remove|exclui)\s+(?:o\s+)?(?:último|ultimo)\s+gasto/.test(msg)) {
      return await this.handleDeleteLastExpense(user.id);
    }
    if (/(apaga|remove|exclui).*(gasto)/.test(msg)) {
      return await this.deleteExpense(user.id, message);
    }
    if (/(cancela|remove|exclui).*(lembrete)/.test(msg)) {
      return await this.deleteReminder(user.id, message);
    }
    if (/(quanto.*(posso|ainda).*gastar)|(saldo.*dispon[ií]vel)/.test(msg)) {
      return await this.getAvailableBalance(user.id);
    }
    if (/(orçamento|budget).*?(\d+)/.test(msg)) {
      return await this.setMonthlyBudget(user.id, message);
    }
    if (/já\s+paguei|pagamento.*(feito|realizado)/.test(msg)) {
      return 'Pagamento registrado! 😊';
    }
    if (/\/ajuda|ajuda|comandos/.test(msg)) {
      return this.getHelpMessage();
    }

    return 'Oi! Não consegui entender muito bem 😕. Pode me explicar de outra forma ou digitar /ajuda para ver o que posso fazer por você?';
  }

  private async handleRegisterExpense(userId: string, message: string): Promise<string> {
    const regex = /(?:gastei|fiz(?:\s+um)?\s+gasto).*?(\d+[.,]?\d*)/i;
    const match = message.match(regex);
    if (!match) {
      return 'Não consegui identificar o valor do gasto 😕. Por favor, tente novamente informando um número!';
    }
    const value = parseFloat(match[1].replace(',', '.'));
    let description = message.replace(/(?:gastei|fiz(?:\s+um)?\s+gasto)/i, '');
    description = description.replace(match[1], '');
    description = description.replace(/\b(no|na|em)\b/gi, '');
    description = description.trim();
    if (!description) description = 'Gasto sem descrição';

    const category = categorizeExpense(description);

    await this.prisma.expense.create({
      data: {
        description,
        value,
        category,
        user: { connect: { id: userId } },
      },
    });

    const startOfMonth = dayjs().startOf('month').toDate();
    const endOfMonth = dayjs().endOf('month').toDate();
    const userRecord = await this.prisma.user.findUnique({ where: { id: userId } });
    let warningMessage = '';
    if (userRecord && userRecord.monthlyBudget) {
      const totalResult = await this.prisma.expense.aggregate({
        _sum: { value: true },
        where: { userId, createdAt: { gte: startOfMonth, lte: endOfMonth } },
      });
      const totalExpenses = totalResult._sum.value || 0;
      const percentage = (totalExpenses / userRecord.monthlyBudget) * 100;
      if (percentage >= 100) {
        const exceeded = totalExpenses - userRecord.monthlyBudget;
        warningMessage = `\nATENÇÃO: Você ultrapassou seu orçamento em R$ ${exceeded.toFixed(2)}.`;
      } else if (percentage >= 85) {
        warningMessage = `\nATENÇÃO: Você já gastou ${percentage.toFixed(0)}% do seu orçamento. O orçamento está quase acabando!`;
      } else if (percentage >= 50) {
        warningMessage = `\nATENÇÃO: Você já gastou ${percentage.toFixed(0)}% do seu orçamento.`;
      }
    }

    return `Gasto de R$ ${value.toFixed(2)} (${description}) registrado com sucesso! Categoria: ${category}.${warningMessage}`;
  }

  private async handleListExpenses(userId: string, message: string): Promise<string> {
    const lowerMsg = message.toLowerCase();
    let startDate: Date;
    let endDate: Date;
    let header: string;

    const monthNames: Record<string, number> = {
      'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
      'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
      'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12,
    };

    const foundMonth = Object.keys(monthNames).find((monthName) => lowerMsg.includes(monthName));
    if (foundMonth) {
      const month = monthNames[foundMonth];
      let year = dayjs().year();
      const yearRegex = /(\d{4})/;
      const yearMatch = lowerMsg.match(yearRegex);
      if (yearMatch) {
        year = parseInt(yearMatch[1], 10);
      }
      startDate = dayjs(new Date(year, month - 1, 1)).startOf('day').toDate();
      endDate = dayjs(new Date(year, month - 1, 1)).endOf('month').toDate();
      header = `Listagem de gastos referentes ao mês de ${dayjs(startDate).format('MMMM [de] YYYY')}\n\n`;
    } else if (/semana/.test(lowerMsg)) {
      startDate = dayjs().day(0).startOf('day').toDate();
      endDate = dayjs().day(6).endOf('day').toDate();
      header = `Listagem de gastos referentes à semana de ${dayjs(startDate).format('DD/MM/YYYY')} até ${dayjs(endDate).format('DD/MM/YYYY')}\n\n`;
    } else {
      startDate = dayjs().startOf('month').toDate();
      endDate = dayjs().endOf('month').toDate();
      header = `Listagem de gastos referentes ao mês de ${dayjs(startDate).format('MMMM [de] YYYY')}\n\n`;
    }

    const expenses = await this.prisma.expense.findMany({
      where: { userId, createdAt: { gte: startDate, lte: endDate } },
      orderBy: { createdAt: 'asc' },
    });
    if (!expenses.length) return 'Nenhum gasto registrado no período.';

    const categoryEmojis: Record<string, string> = {
      'educação': '📚',
      'alimentação': '🍔',
      'transporte': '🚗',
      'lazer': '🎬',
      'saúde': '💊',
      'moradia': '🏠',
      'vestuário': '👗',
      'serviços': '🔧',
      'compras': '🛍️',
      'mercado': '🛒',
      'tecnologia': '💻',
      'finanças': '💰',
      'entretenimento': '🎭',
      'pets': '🐶',
      'beleza': '💄',
      'utilidades': '🔑',
      'viagem': '✈️',
      'assinaturas': '📄',
      'fitness': '🏋️',
      'investimentos': '📈',
      'impostos': '🧾',
      'doações': '🤝',
      'entretenimento digital': '🎮',
      'comunicação': '📞'
    };

    const grouped: Record<string, Array<{ day: string; description: string; value: number }>> = {};
    expenses.forEach((expense) => {
      const category = expense.category || 'Outros';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push({
        day: dayjs(expense.createdAt).format('DD/MM'),
        description: expense.description,
        value: expense.value,
      });
    });

    let listMessage = header;
    for (const [cat, items] of Object.entries(grouped)) {
      const emoji = categoryEmojis[cat.toLowerCase()] || '';
      listMessage += `Categoria: ${cat} ${emoji}\n`;
      items.forEach((item) => {
        listMessage += `  - ${item.description}(${item.day}): R$ ${item.value.toFixed(2)}\n`;
      });
      listMessage += '\n';
    }
    return listMessage;
  }

  private async handleGenerateReport(userId: string, message: string): Promise<string> {
    const lowerMsg = message.toLowerCase();
    let startDate: Date;
    let endDate: Date;
    let header: string;

    const monthNames: Record<string, number> = {
      'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
      'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
      'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12,
    };

    const foundMonth = Object.keys(monthNames).find((monthName) => lowerMsg.includes(monthName));
    if (foundMonth) {
      const month = monthNames[foundMonth];
      let year = dayjs().year();
      const yearRegex = /(\d{4})/;
      const yearMatch = lowerMsg.match(yearRegex);
      if (yearMatch) {
        year = parseInt(yearMatch[1], 10);
      }
      startDate = dayjs(new Date(year, month - 1, 1)).startOf('day').toDate();
      endDate = dayjs(new Date(year, month - 1, 1)).endOf('month').toDate();
      header = `Relatório de gastos referentes ao mês de ${dayjs(startDate).format('MMMM [de] YYYY')}\n\n`;
    } else if (/semana/.test(lowerMsg)) {
      startDate = dayjs().day(0).startOf('day').toDate();
      endDate = dayjs().day(6).endOf('day').toDate();
      header = `Relatório de gastos referentes à semana de ${dayjs(startDate).format('DD/MM/YYYY')} até ${dayjs(endDate).format('DD/MM/YYYY')}\n\n`;
    } else {
      startDate = dayjs().startOf('month').toDate();
      endDate = dayjs().endOf('month').toDate();
      header = `Relatório de gastos referentes ao mês de ${dayjs(startDate).format('MMMM [de] YYYY')}\n\n`;
    }

    const expenses = await this.prisma.expense.findMany({
      where: { userId, createdAt: { gte: startDate, lte: endDate } },
    });
    if (!expenses.length) return 'Nenhum gasto registrado no período.';

    const categoryEmojis: Record<string, string> = {
      'educação': '📚',
      'alimentação': '🍔',
      'transporte': '🚗',
      'lazer': '🎬',
      'saúde': '💊',
      'moradia': '🏠',
      'vestuário': '👗',
      'serviços': '🔧',
      'compras': '🛍️',
      'mercado': '🛒',
      'tecnologia': '💻',
      'finanças': '💰',
      'entretenimento': '🎭',
      'pets': '🐶',
      'beleza': '💄',
      'utilidades': '🔑',
      'viagem': '✈️',
      'assinaturas': '📄',
      'fitness': '🏋️',
      'investimentos': '📈',
      'impostos': '🧾',
      'doações': '🤝',
      'entretenimento digital': '🎮',
      'comunicação': '📞'
    };

    let overallTotal = 0;
    const groupedGlobal: Record<string, Array<{ description: string; value: number; createdAt: Date }>> = {};
    expenses.forEach((expense) => {
      overallTotal += expense.value;
      const cat = expense.category || 'Outros';
      if (!groupedGlobal[cat]) groupedGlobal[cat] = [];
      groupedGlobal[cat].push({
        description: expense.description,
        value: expense.value,
        createdAt: expense.createdAt,
      });
    });

    let globalReport = header;
    for (const [cat, items] of Object.entries(groupedGlobal)) {
      const emoji = categoryEmojis[cat.toLowerCase()] || '';
      globalReport += `Categoria: ${cat} ${emoji}\n`;
      items.forEach((expense) => {
        globalReport += `  - ${expense.description}(${dayjs(expense.createdAt).format('DD/MM')}): R$ ${expense.value.toFixed(2)}\n`;
      });
      const categoryTotal = items.reduce((sum, exp) => sum + exp.value, 0);
      globalReport += `  Total da categoria: R$ ${categoryTotal.toFixed(2)}\n\n`;
    }
    globalReport += `Total geral: R$ ${overallTotal.toFixed(2)}\n\n`;

    const topCategories = Object.entries(groupedGlobal)
      .map(([cat, items]) => ({
        category: cat,
        total: items.reduce((sum, exp) => sum + exp.value, 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
    const overallItems: Record<string, { total: number; original: string }> = {};
    expenses.forEach((exp) => {
      const norm = normalizeText(exp.description);
      if (!overallItems[norm]) {
        overallItems[norm] = { total: 0, original: exp.description };
      }
      overallItems[norm].total += exp.value;
    });
    const topItems = Object.values(overallItems)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    let globalTopReport = 'Top categorias:\n';
    topCategories.forEach((tc) => {
      globalTopReport += `  • ${tc.category}: R$ ${tc.total.toFixed(2)}\n`;
    });
    globalTopReport += '\nTop itens:\n';
    topItems.forEach((ti) => {
      globalTopReport += `  • ${ti.original}: R$ ${ti.total.toFixed(2)}\n`;
    });
    globalTopReport += `\nTotal geral: R$ ${overallTotal.toFixed(2)}`;

    return globalReport + globalTopReport;
  }

  private async handleAddReminder(userId: string, message: string): Promise<string> {
    const regex = /(?:\/lembrete|adiciona(?:r)?\s+lembrete|cadastra(?:r)?\s+lembrete|criar(?:\s+um)?\s+lembrete)(.*)/i;
    const match = message.match(regex);
    if (!match || !match[1].trim()) {
      return 'Você deve informar uma data/horário ou recorrência para o lembrete.';
    }
    
    let reminderText = match[1].trim();
    let scheduledAt: Date | null = null;
    let recurrence: string | null = null;

    const daquiMinutosRegex = /daqui a (?:(\d+)|um)\s*minuto[s]?/i;
    const daquiMinutosMatch = reminderText.match(daquiMinutosRegex);
    if (daquiMinutosMatch) {
      const minutes = daquiMinutosMatch[1] ? parseInt(daquiMinutosMatch[1], 10) : 1;
      scheduledAt = dayjs().add(minutes, 'minute').startOf('minute').toDate();
      reminderText = reminderText.replace(daquiMinutosRegex, '').trim();
    }
    const daquiHorasRegex = /daqui a (?:(\d+)|uma)\s*hora[s]?/i;
    const daquiHorasMatch = reminderText.match(daquiHorasRegex);
    if (daquiHorasMatch) {
      const hours = daquiHorasMatch[1] ? parseInt(daquiHorasMatch[1], 10) : 1;
      scheduledAt = dayjs().add(hours, 'hour').startOf('minute').toDate();
      reminderText = reminderText.replace(daquiHorasRegex, '').trim();
    }
    const daquiDiasRegex = /daqui a (\d+)\s*dias?/i;
    const daquiDiasMatch = reminderText.match(daquiDiasRegex);
    if (daquiDiasMatch) {
      const days = parseInt(daquiDiasMatch[1], 10);
      scheduledAt = dayjs().add(days, 'day').startOf('minute').toDate();
      reminderText = reminderText.replace(daquiDiasRegex, '').trim();
    }
    const daquiSemanasRegex = /daqui a (?:(\d+)|uma)\s*semana[s]?/i;
    const daquiSemanasMatch = reminderText.match(daquiSemanasRegex);
    if (daquiSemanasMatch) {
      const weeks = daquiSemanasMatch[1] ? parseInt(daquiSemanasMatch[1], 10) : 1;
      scheduledAt = dayjs().add(weeks, 'week').startOf('minute').toDate();
      reminderText = reminderText.replace(daquiSemanasRegex, '').trim();
    }
    const daquiMesesRegex = /daqui a (\d+)\s*meses?/i;
    const daquiMesesMatch = reminderText.match(daquiMesesRegex);
    if (daquiMesesMatch) {
      const months = parseInt(daquiMesesMatch[1], 10);
      scheduledAt = dayjs().add(months, 'month').startOf('minute').toDate();
      reminderText = reminderText.replace(daquiMesesRegex, '').trim();
    }
    const diaRegex = /dia\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i;
    const diaMatch = reminderText.match(diaRegex);
    if (diaMatch) {
      let dateString = diaMatch[1];
      const parts = dateString.split('/');
      if (parts.length === 2) {
        dateString = `${dateString}/${dayjs().year()}`;
      }
      scheduledAt = dayjs(dateString, 'D/M/YYYY').toDate();
      reminderText = reminderText.replace(diaRegex, '').trim();
    }
    if (/fixo\s+semanal/i.test(reminderText) || /toda\s+semana/i.test(reminderText)) {
      recurrence = 'weekly';
      reminderText = reminderText.replace(/fixo\s+semanal/i, '').replace(/toda\s+semana/i, '').trim();
    }
    if (/fixo\s+mensal/i.test(reminderText) || /todo\s+m[eé]s/i.test(reminderText) || /toda\s+m[eé]s/i.test(reminderText)) {
      recurrence = 'monthly';
      reminderText = reminderText.replace(/fixo\s+mensal/i, '').replace(/todo\s+m[eé]s/i, '').replace(/toda\s+m[eé]s/i, '').trim();
    }
    if (!scheduledAt && !recurrence) {
      return 'Você deve informar uma data/horário ou recorrência para o lembrete.';
    }

    await this.prisma.reminder.create({
      data: {
        description: reminderText,
        scheduledAt: scheduledAt,
        recurrence: recurrence,
        user: { connect: { id: userId } },
      },
    });
    
    let response = `Lembrete "${reminderText}" cadastrado com sucesso!`;
    if (scheduledAt) {
      response += `\nSerá lembrado em ${dayjs(scheduledAt).format('DD/MM/YYYY HH:mm')}.`;
    }
    if (recurrence) {
      response += `\nEsse lembrete é recorrente (${recurrence}).`;
    }
    return response;
  }

  private async listReminders(userId: string): Promise<string> {
    const reminders = await this.prisma.reminder.findMany({
      where: { userId, active: true },
    });
    if (!reminders.length) return 'Você não possui lembretes ativos.';
    let response = 'Seus lembretes ativos:\n';
    reminders.forEach((rem) => {
      let extra = '';
      if (rem.scheduledAt) {
        extra += ` - Agendado para ${dayjs(rem.scheduledAt).format('DD/MM/YYYY HH:mm')}`;
      }
      if (rem.recurrence) {
        extra += ` (Recorrente: ${rem.recurrence})`;
      }
      response += `• ${rem.description}${extra}\n`;
    });
    return response;
  }

  private async handleDeleteLastExpense(userId: string): Promise<string> {
    const lastExpense = await this.prisma.expense.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (!lastExpense) {
      return 'Nenhum gasto encontrado para ser removido.';
    }
    await this.prisma.expense.delete({ where: { id: lastExpense.id } });
    return 'Último gasto removido com sucesso! 😊';
  }

  private async deleteExpense(userId: string, message: string): Promise<string> {
    const match = message.match(/(?:apaga|remove|exclui)[\s\w]*gasto(?:\s+do)?\s+(.+)/i);
    if (!match || match.length < 2)
      return 'Não foi possível identificar o gasto a ser removido.';
    const description = match[1].trim();
    const expense = await this.prisma.expense.findFirst({
      where: { userId, description: { contains: description } },
    });
    if (!expense) return 'Gasto não encontrado.';
    await this.prisma.expense.delete({ where: { id: expense.id } });
    return 'Gasto removido com sucesso! 😊';
  }

  private async deleteReminder(userId: string, message: string): Promise<string> {
    const match = message.match(/(?:cancela|remove|exclui)[\s\w]*lembrete(?:\s+de)?\s+(.+)/i);
    if (!match || match.length < 2)
      return 'Não foi possível identificar o lembrete a ser removido.';
    const description = match[1].trim();
    const reminder = await this.prisma.reminder.findFirst({
      where: { userId, description: { contains: description } },
    });
    if (!reminder) return 'Lembrete não encontrado.';
    await this.prisma.reminder.update({
      where: { id: reminder.id },
      data: { active: false },
    });
    return 'Lembrete removido com sucesso! 😊';
  }

  private async getAvailableBalance(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return 'Usuário não encontrado';
    if (!user.monthlyBudget)
      return 'Você ainda não definiu seu orçamento mensal.';
    const startOfMonth = dayjs().startOf('month').toDate();
    const endOfMonth = dayjs().endOf('month').toDate();
    const expenses = await this.prisma.expense.findMany({
      where: { userId, createdAt: { gte: startOfMonth, lte: endOfMonth } },
    });
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.value, 0);
    const available = user.monthlyBudget - totalExpenses;
    if (available >= 0) {
      return `Seu orçamento mensal é R$ ${user.monthlyBudget.toFixed(2)} e você tem R$ ${available.toFixed(2)} restantes para gastar.`;
    } else {
      return `Seu orçamento mensal é R$ ${user.monthlyBudget.toFixed(2)} e você ultrapassou em R$ ${Math.abs(available).toFixed(2)}.`;
    }
  }

  private async setMonthlyBudget(userId: string, message: string): Promise<string> {
    const regex = /(orçamento|budget).*?(\d+[.,]?\d*)/i;
    const match = message.match(regex);
    if (!match) return 'Não foi possível identificar o valor do orçamento.';
    const budget = parseFloat(match[2].replace(',', '.'));
    await this.usersService.updateUserBudget(userId, budget);
    return `Orçamento definido como R$ ${budget.toFixed(2)}.`;
  }

  private getHelpMessage(): string {
    return `Oi, tudo bem? Aqui estão alguns comandos que você pode usar:

• *Registrar gasto:*  
  "Gastei 50 no almoço" ou "Fiz um gasto de 20 com transporte" 📝

• *Listar gastos:*  
  "Me mostra meus gastos" ou "/gastos semana" ou "/gastos janeiro" 📆

• *Gerar relatório:*  
  "Quero saber quanto gastei" ou "/relatorio" 📊

• *Criar lembrete:*  
  "Quero criar um lembrete para pagar a fatura daqui a 1 minuto"  
  "Quero criar um lembrete fixo mensal para pagar a conta" ⏰

• *Remover registro:*  
  "Apaga o gasto do almoço" ou "Remove o último gasto" ou "Cancela o lembrete de pagar conta" ❌

• *Consultar saldo:*  
  "Quanto posso gastar?" ou "Qual meu saldo disponível?" 💰

• *Definir orçamento:*  
  "Meu orçamento é 500" 🎯

Estou aqui para te ajudar! 😉`;
  }

  async sendWhatsAppMessage(phone: string, message: string): Promise<void> {
    if (!this.client) {
      this.logger.error('Cliente do WhatsApp não inicializado');
      return;
    }
    if (!phone.includes('@')) {
      phone = `${phone}@c.us`;
    }
    await this.client.sendText(phone, message);
  }
}
