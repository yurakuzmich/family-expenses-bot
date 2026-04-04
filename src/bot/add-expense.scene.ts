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
      'Добавь расход в формате:\n\"Название цена\"\nНапример: Сосиски 45000',
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
        'You are already adding an expense. Send the line with the amount at the end.',
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

    const parsed = this.parser.parse(raw);
    if (!parsed) {
      await ctx.reply(
        'Could not parse. Send text ending with a positive number, e.g. "Groceries 2500".',
      );
      return;
    }

    await this.expensesService.create(
      user._id,
      user.name,
      parsed.expenseName,
      parsed.amount,
      user.familyId,
    );
    await ctx.scene.leave();
    await ctx.reply(
      `Saved: ${parsed.expenseName} — ${parsed.amount}`,
      mainMenuKeyboard(),
    );
  }
}
