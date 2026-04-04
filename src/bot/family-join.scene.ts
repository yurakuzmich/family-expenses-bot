import { Injectable } from '@nestjs/common';
import { On, Scene, SceneEnter, Ctx } from 'nestjs-telegraf';
import { FamiliesService } from '../family/families.service';
import { UsersService } from '../user/users.service';
import { BTN_CREATE_FAMILY, BTN_JOIN_FAMILY } from './bot.constants';
import { getTextMessage, type BotContext } from './bot-context';
import { mainMenuKeyboard, preFamilyKeyboard } from './bot-keyboards';

@Injectable()
@Scene('family_join')
export class FamilyJoinScene {
  constructor(
    private readonly usersService: UsersService,
    private readonly familiesService: FamiliesService,
  ) {}

  @SceneEnter()
  async enter(@Ctx() ctx: BotContext) {
    await ctx.reply(
      'Отправьте пригласительный код (буквы и цифры).',
      preFamilyKeyboard(),
    );
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const raw = getTextMessage(ctx);
    if (raw === null) {
      return;
    }
    if (raw === BTN_JOIN_FAMILY) {
      await ctx.reply('Отправьте пригласительный код как сообщение.');
      return;
    }
    if (raw === BTN_CREATE_FAMILY) {
      await ctx.scene.leave();
      await ctx.reply('Используйте Создать семью из меню, или нажмите еще раз.');
      return;
    }
    if (!ctx.from) {
      return;
    }
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.scene.leave();
      await ctx.reply('Используйте /start для регистрации.');
      return;
    }
    if (user.familyId) {
      await ctx.scene.leave();
      await ctx.reply('Вы уже состоите в семье.', mainMenuKeyboard());
      return;
    }

    const joined = await this.familiesService.joinFamilyByCode(raw, user._id);
    if (joined === 'INVALID_CODE') {
      await ctx.reply(
        'Неверный код. Попробуйте еще раз или попросите владельца семьи выдать новый код.',
      );
      return;
    }
    if (joined === 'ALREADY_IN_FAMILY') {
      await ctx.scene.leave();
      await ctx.reply('Вы уже состоите в семье.', mainMenuKeyboard());
      return;
    }

    await ctx.scene.leave();
    await ctx.reply(
      'Вы присоединились к семье. Теперь вы можете видеть общую статистику и добавлять свои расходы.',
      mainMenuKeyboard(),
    );
  }
}
