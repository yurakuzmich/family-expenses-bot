import { Markup } from 'telegraf';
import type { StatsPeriod } from '../expense/stats-period';
import {
  BTN_ADD_EXPENSE,
  BTN_CREATE_FAMILY,
  BTN_FAMILY,
  BTN_JOIN_FAMILY,
  BTN_SHOW_STATS,
  BTN_SHOW_DETAILED,
  CB_STATS_DET_CURRENT,
  CB_STATS_DET_PREVIOUS,
  CB_STATS_SUM_CURRENT,
  CB_STATS_SUM_PREVIOUS,
} from './bot.constants';

export const preFamilyKeyboard = () =>
  Markup.keyboard([[BTN_CREATE_FAMILY], [BTN_JOIN_FAMILY]]).resize();

export const mainMenuKeyboard = () =>
  Markup.keyboard([[BTN_ADD_EXPENSE, BTN_SHOW_STATS], [BTN_FAMILY]]).resize();

export const statsPeriodPickerKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('Этот месяц', CB_STATS_SUM_CURRENT),
      Markup.button.callback('Прошлый месяц', CB_STATS_SUM_PREVIOUS),
    ],
  ]);

export const statsDetailKeyboardForPeriod = (period: StatsPeriod) =>
  Markup.inlineKeyboard([
    Markup.button.callback(
      BTN_SHOW_DETAILED,
      period === 'current' ? CB_STATS_DET_CURRENT : CB_STATS_DET_PREVIOUS,
    ),
  ]);
