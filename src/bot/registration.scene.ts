import { Injectable } from '@nestjs/common';
import { On, Scene, SceneEnter, Ctx } from 'nestjs-telegraf';
import { UsersService } from '../user/users.service';
import { getTextMessage, type BotContext } from './bot-context';
import { preFamilyKeyboard } from './bot-keyboards';

@Injectable()
@Scene('registration')
export class RegistrationScene {
  constructor(private readonly usersService: UsersService) {}

  @SceneEnter()
  async enter(@Ctx() ctx: BotContext) {
    await ctx.reply('Как вас зовут? (должно быть уникальным среди всех пользователей бота)', {
      reply_markup: { remove_keyboard: true },
    });
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const raw = getTextMessage(ctx);
    if (raw === null) {
      return;
    }
    const text = raw.trim();
    if (!text) {
      await ctx.reply('Отправьте не пустое имя.');
      return;
    }
    if (!ctx.from) {
      return;
    }
    const result = await this.usersService.register(ctx.from.id, text);
    if (!result.ok) {
      await ctx.reply(
        'Это имя уже занято. Отправьте другое имя (имя должно быть уникальным).',
      );
      return;
    }
    await ctx.scene.leave();
    await ctx.reply(
      `Зарегистрирован как ${text}.\n\nСоздайте новую семью или присоединитесь с помощью пригласительного кода от владельца.`,
      preFamilyKeyboard(),
    );
  }
}
