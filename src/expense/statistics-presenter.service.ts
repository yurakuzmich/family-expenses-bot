import { Injectable } from '@nestjs/common';
import { UsersService } from '../user/users.service';
import { ExpensesService } from './expenses.service';
import { MonthRangeService } from './month-range.service';
import type { StatsPeriod } from './stats-period';

@Injectable()
export class StatisticsPresenterService {
  constructor(
    private readonly expenses: ExpensesService,
    private readonly monthRange: MonthRangeService,
    private readonly users: UsersService,
  ) {}

  async buildCommonSummary(
    telegramId: number,
    period: StatsPeriod,
  ): Promise<string> {
    const user = await this.users.findByTelegramId(telegramId);
    if (!user?.familyId) {
      return 'Create or join a family first.';
    }
    const { from, to } = this.monthRange.rangeForPeriod(period);
    const rows = await this.expenses.totalsByUserInFamilySince(
      from,
      to,
      user.familyId,
    );
    const title = this.monthRange.periodTitle(period);
    if (rows.length === 0) {
      return `Не было расходов в ${title}.`;
    }
    const lines = rows.map((r) => `${r.userName} | ${r.totalAmount}`);
    return `${title}\n\n${lines.join('\n')}`;
  }
}
