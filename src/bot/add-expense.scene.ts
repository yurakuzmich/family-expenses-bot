import { Injectable } from '@nestjs/common';
import { On, Scene, SceneEnter, Ctx } from 'nestjs-telegraf';
import { ExpenseParserService } from '../expense/expense-parser.service';
import { ExpensesService } from '../expense/expenses.service';
import { UsersService } from '../user/users.service';
import { BTN_ADD_EXPENSE, BTN_SHOW_STATS } from './bot.constants';
import { getTextMessage, type BotContext } from './bot-context';
import { mainMenuKeyboard, statsPeriodPickerKeyboard } from './bot-keyboards';

@Injectable()
@Scene('add_expense')
export class AddExpenseScene {
  constructor(
    private readonly usersService: UsersService,
    private readonly expensesService: ExpensesService,
    private readonly parser: ExpenseParserService,
  ) {}

  @SceneEnter()
  async enter(@Ctx() ctx: BotContext) {
    await ctx.reply(
      [
        'Добавь расход(ы). Каждая строка — отдельный расход:',
        '«Название сумма»',
        '',
        'Пример одной строки: Сосиски 45000',
        '',
        'Или несколько строк:',
        'Хлеб 10000',
        'Молоко 14000',
        'Спички 1200',
      ].join('\n'),
      mainMenuKeyboard(),
    );
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const raw = getTextMessage(ctx);
    if (raw === null) {
      return;
    }
    if (raw === BTN_ADD_EXPENSE) {
      await ctx.reply(
        'Ты уже в режиме добавления. Пришли строку(и) с суммой в конце каждой.',
      );
      return;
    }
    if (raw === BTN_SHOW_STATS) {
      await ctx.scene.leave();
      await ctx.reply('Choose a period:', statsPeriodPickerKeyboard());
      return;
    }

    if (!ctx.from) {
      return;
    }
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.scene.leave();
      await ctx.reply('You are not registered. Use /start.');
      return;
    }
    if (!user.familyId) {
      await ctx.scene.leave();
      await ctx.reply('Join or create a family first.');
      return;
    }

    const { items, invalidLines } = this.parser.parseLines(raw);
    if (items.length === 0) {
      await ctx.reply(
        [
          'Не удалось разобрать ни одной строки.',
          'Формат: название, пробел, положительное число в конце строки.',
          'Пример: Хлеб 10000',
        ].join('\n'),
      );
      return;
    }

    for (const item of items) {
      await this.expensesService.create(
        user._id,
        user.name,
        item.expenseName,
        item.amount,
        user.familyId,
      );
    }

    const savedLines = items.map((i) => `• ${i.expenseName} — ${i.amount}`);
    const total = items.reduce((sum, i) => sum + i.amount, 0);
    let reply = [`Сохранено ${items.length}:`, ...savedLines].join('\n');
    if (invalidLines.length > 0) {
      reply += [
        '',
        `Пропущено (${invalidLines.length}), неверный формат:`,
        ...invalidLines.map((l) => `• ${l}`),
      ].join('\n');
    }
    reply += `\n\nВсего: ${total}`;

    await ctx.scene.leave();
    await ctx.reply(reply, mainMenuKeyboard());
  }
}
