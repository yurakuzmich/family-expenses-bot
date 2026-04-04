import { Injectable } from '@nestjs/common';
import { Action, Command, Ctx, Hears, Start, Update } from 'nestjs-telegraf';
import { FamiliesService } from '../family/families.service';
import { StatisticsPresenterService } from '../expense/statistics-presenter.service';
import type { StatsPeriod } from '../expense/stats-period';
import { UsersService } from '../user/users.service';
import {
  BTN_CREATE_FAMILY,
  BTN_FAMILY,
  BTN_JOIN_FAMILY,
  BTN_ADD_EXPENSE,
  BTN_SHOW_STATS,
  CB_STATS_DET_CURRENT,
  CB_STATS_DET_PREVIOUS,
  CB_STATS_SUM_CURRENT,
  CB_STATS_SUM_PREVIOUS,
} from './bot.constants';
import { setStatsPeriod, type BotContext } from './bot-context';
import {
  mainMenuKeyboard,
  preFamilyKeyboard,
  statsDetailKeyboardForPeriod,
  statsPeriodPickerKeyboard,
} from './bot-keyboards';

@Injectable()
@Update()
export class BotUpdate {
  constructor(
    private readonly usersService: UsersService,
    private readonly familiesService: FamiliesService,
    private readonly statisticsPresenter: StatisticsPresenterService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    if (!ctx.from) {
      return;
    }
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.scene.enter('registration');
      return;
    }
    if (!user.familyId) {
      await ctx.reply(
        `Hello, ${user.name}. Create a family or join with an invite code.`,
        preFamilyKeyboard(),
      );
      return;
    }
    await ctx.reply(`Hello, ${user.name}.`, mainMenuKeyboard());
  }

  @Command('cancel')
  async onCancel(@Ctx() ctx: BotContext) {
    await ctx.scene.leave();
    if (!ctx.from) {
      return;
    }
    const kb = await this.menuForUser(ctx.from.id);
    await ctx.reply('Cancelled.', kb);
  }

  @Hears(BTN_CREATE_FAMILY)
  async onCreateFamily(@Ctx() ctx: BotContext) {
    if (!ctx.from) {
      return;
    }
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply('Нажмите /start для регистрации.');
      return;
    }
    if (user.familyId) {
      await ctx.reply('Вы уже состоите в семье.', mainMenuKeyboard());
      return;
    }
    const result = await this.familiesService.createFamilyForUser(user._id);
    if (result === 'ALREADY_IN_FAMILY') {
      await ctx.reply('Вы уже состоите в семье.', mainMenuKeyboard());
      return;
    }
    if (result === 'USER_NOT_FOUND') {
      await ctx.reply('Что-то пошло не так... Попробуйте нажать /start еще раз.');
      return;
    }
    await ctx.reply(
      [
        'Семья создана. Вы - владелец.',
        '',
        `Пригласительный код (делитесь только с людьми, которым вы доверяете): \`${result.inviteCode}\``,
        '',
        'Члены семьи должна ныжать “Присоединиться к семье”  и ввести этот код.',
      ].join('\n'),
      { parse_mode: 'Markdown', ...mainMenuKeyboard() },
    );
  }

  @Hears(BTN_JOIN_FAMILY)
  async onJoinFamily(@Ctx() ctx: BotContext) {
    if (!ctx.from) {
      return;
    }
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply('Нажмите /start для регистрации.');
      return;
    }
    if (user.familyId) {
      await ctx.reply('Вы уже состоите в семье.', mainMenuKeyboard());
      return;
    }
    await ctx.scene.enter('family_join');
  }

  @Hears(BTN_FAMILY)
  async onFamily(@Ctx() ctx: BotContext) {
    if (!ctx.from) {
      return;
    }
    const ok = await this.requireRegisteredWithFamily(ctx);
    if (!ok) {
      return;
    }
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user?.familyId) {
      return;
    }
    const family = await this.familiesService.findById(user.familyId);
    if (!family) {
      await ctx.reply('Семья не найдена.');
      return;
    }
    const owner = await this.usersService.findById(family.ownerUserId);
    const ownerIsYou = await this.familiesService.isOwner(
      user.familyId,
      user._id,
    );
    if (ownerIsYou) {
      await ctx.reply(
        [
          'Вы - владелец семьи.',
          '',
          `Пригласительный код: \`${family.inviteCode}\``,
          '',
          'Любой пользователь, обладающий этим кодом, может присоединиться и видеть статистику семьи',
        ].join('\n'),
        { parse_mode: 'Markdown', ...mainMenuKeyboard() },
      );
      return;
    }
    await ctx.reply(
      [
        'Вы состоите в семье.',
        owner ? `Владелец: ${owner.name}` : '',
        '',
        'Для добавления пользователей в семью, попросите владельца семьи добавить их.',
      ]
        .filter(Boolean)
        .join('\n'),
      mainMenuKeyboard(),
    );
  }

  @Hears(BTN_ADD_EXPENSE)
  async onAddExpense(@Ctx() ctx: BotContext) {
    const ok = await this.requireRegisteredWithFamily(ctx);
    if (!ok) {
      return;
    }
    await ctx.scene.enter('add_expense');
  }

  @Hears(BTN_SHOW_STATS)
  async onShowStats(@Ctx() ctx: BotContext) {
    if (!ctx.from) {
      return;
    }
    const ok = await this.requireRegisteredWithFamily(ctx);
    if (!ok) {
      return;
    }
    await ctx.reply('Выберите период:', statsPeriodPickerKeyboard());
  }

  @Action(CB_STATS_SUM_CURRENT)
  async onStatsSumCurrent(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.replyStatsSummary(ctx, 'current');
  }

  @Action(CB_STATS_SUM_PREVIOUS)
  async onStatsSumPrevious(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.replyStatsSummary(ctx, 'previous');
  }

  @Action(CB_STATS_DET_CURRENT)
  async onStatsDetCurrent(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.enterStatsDetail(ctx, 'current');
  }

  @Action(CB_STATS_DET_PREVIOUS)
  async onStatsDetPrevious(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.enterStatsDetail(ctx, 'previous');
  }

  private async replyStatsSummary(ctx: BotContext, period: StatsPeriod) {
    if (!ctx.from) {
      return;
    }
    const text = await this.statisticsPresenter.buildCommonSummary(
      ctx.from.id,
      period,
    );
    await ctx.reply(text, statsDetailKeyboardForPeriod(period));
  }

  private async enterStatsDetail(ctx: BotContext, period: StatsPeriod) {
    const ok = await this.requireRegisteredWithFamily(ctx);
    if (!ok) {
      return;
    }
    setStatsPeriod(ctx, period);
    await ctx.scene.enter('stats_detail');
  }

  private async menuForUser(telegramId: number) {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user?.familyId) {
      return preFamilyKeyboard();
    }
    return mainMenuKeyboard();
  }

  private async requireRegisteredWithFamily(ctx: BotContext): Promise<boolean> {
    if (!ctx.from) {
      return false;
    }
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply('Нажмите /start для регистрации.');
      return false;
    }
    if (!user.familyId) {
      await ctx.reply('Создайте или присоединитесь к семье.', preFamilyKeyboard());
      return false;
    }
    return true;
  }
}
