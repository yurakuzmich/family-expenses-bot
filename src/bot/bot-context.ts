import { Scenes } from 'telegraf';
import type { StatsPeriod } from '../expense/stats-period';

export interface BotSession extends Scenes.SceneSessionData {
  statsPeriod?: StatsPeriod;
}

export type BotContext = Scenes.SceneContext<BotSession>;

function sessionData(ctx: BotContext): BotSession {
  return ctx.session as unknown as BotSession;
}

export function setStatsPeriod(ctx: BotContext, period: StatsPeriod): void {
  sessionData(ctx).statsPeriod = period;
}

export function getStatsPeriod(ctx: BotContext): StatsPeriod {
  return sessionData(ctx).statsPeriod ?? 'current';
}

export function clearStatsPeriod(ctx: BotContext): void {
  delete sessionData(ctx).statsPeriod;
}

export function getTextMessage(ctx: BotContext): string | null {
  const msg = ctx.message;
  if (!msg || !('text' in msg) || typeof msg.text !== 'string') {
    return null;
  }
  return msg.text;
}
