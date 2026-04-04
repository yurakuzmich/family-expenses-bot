import { Injectable } from '@nestjs/common';
import { On, Scene, SceneEnter, Ctx } from 'nestjs-telegraf';
import { ExpensesService } from '../expense/expenses.service';
import { MonthRangeService } from '../expense/month-range.service';
import type { StatsPeriod } from '../expense/stats-period';
import { UsersService } from '../user/users.service';
import {
  clearStatsPeriod,
  getStatsPeriod,
  getTextMessage,
  setStatsPeriod,
  type BotContext,
} from './bot-context';
import { mainMenuKeyboard } from './bot-keyboards';

@Injectable()
@Scene('stats_detail')
export class StatsDetailScene {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly monthRange: MonthRangeService,
    private readonly usersService: UsersService,
  ) {}

  @SceneEnter()
  async enter(@Ctx() ctx: BotContext) {
    const period: StatsPeriod = getStatsPeriod(ctx);
    setStatsPeriod(ctx, period);
    const title = this.monthRange.periodTitle(period);
    await ctx.reply(
      `Подробная статистика — ${title}.\nВведи имя пользователя (должен быть членом семьи):`,
      mainMenuKeyboard(),
    );
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const raw = getTextMessage(ctx);
    if (raw === null) {
      return;
    }
    const name = raw.trim();
    if (!ctx.from) {
      return;
    }
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user?.familyId) {
      clearStatsPeriod(ctx);
      await ctx.scene.leave();
      await ctx.reply('Присоединитесь или создайте семью.', mainMenuKeyboard());
      return;
    }

    const memberOk = await this.usersService.isNameAmongFamilyMembers(
      user.familyId,
      name,
    );
    if (!memberOk) {
      clearStatsPeriod(ctx);
      await ctx.scene.leave();
      await ctx.reply(
        'Нет члена семьи с таким именем. Используйте точное имя, которое кто-то зарегистрировал.',
        mainMenuKeyboard(),
      );
      return;
    }

    const period: StatsPeriod = getStatsPeriod(ctx);
    const { from, to } = this.monthRange.rangeForPeriod(period);
    const title = this.monthRange.periodTitle(period);
    const rows = await this.expensesService.detailsByUserNameInFamilySince(
      name,
      from,
      to,
      user.familyId,
    );
    clearStatsPeriod(ctx);
    await ctx.scene.leave();

    if (rows.length === 0) {
      await ctx.reply(
        `У "${name}" не было расходов в ${title}.`,
        mainMenuKeyboard(),
      );
      return;
    }

    const header = `${name} (${title})\n`;
    const lines = rows.map(
      (r) =>
        `${r.expenseName} | ${this.monthRange.formatDdMm(r.occurredAt)} | ${r.amount}`,
    );
    await ctx.reply(`${header}\n${lines.join('\n')}`, mainMenuKeyboard());
  }
}
