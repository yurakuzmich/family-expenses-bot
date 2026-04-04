import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import type { StatsPeriod } from './stats-period';

@Injectable()
export class MonthRangeService {
  constructor(private readonly config: ConfigService) {}

  private get zone(): string {
    return this.config.get<string>('app.timezone', 'UTC');
  }

  /** Inclusive start (00:00 first day of current month), end = now. */
  currentMonthRangeToNow(): { from: Date; to: Date } {
    const now = DateTime.now().setZone(this.zone);
    const start = now.startOf('month');
    return {
      from: start.toJSDate(),
      to: now.toJSDate(),
    };
  }

  /** Full previous calendar month in the configured timezone. */
  previousFullMonthRange(): { from: Date; to: Date } {
    const now = DateTime.now().setZone(this.zone);
    const prev = now.minus({ months: 1 });
    return {
      from: prev.startOf('month').toJSDate(),
      to: prev.endOf('month').toJSDate(),
    };
  }

  rangeForPeriod(period: StatsPeriod): { from: Date; to: Date } {
    return period === 'current'
      ? this.currentMonthRangeToNow()
      : this.previousFullMonthRange();
  }

  periodTitle(period: StatsPeriod): string {
    const z = this.zone;
    const now = DateTime.now().setZone(z);
    if (period === 'current') {
      return `${now.toFormat('LLLL yyyy')} (с начала месяца)`;
    }
    const prev = now.minus({ months: 1 });
    return prev.toFormat('LLLL yyyy');
  }

  formatDdMm(d: Date): string {
    return DateTime.fromJSDate(d, { zone: this.zone }).toFormat('dd.MM');
  }
}
