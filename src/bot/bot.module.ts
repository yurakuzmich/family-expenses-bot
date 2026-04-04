import { Module } from '@nestjs/common';
import { AddExpenseScene } from './add-expense.scene';
import { BotUpdate } from './bot.update';
import { FamilyJoinScene } from './family-join.scene';
import { RegistrationScene } from './registration.scene';
import { StatsDetailScene } from './stats-detail.scene';
import { ExpenseModule } from '../expense/expense.module';
import { FamilyModule } from '../family/family.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule, ExpenseModule, FamilyModule],
  providers: [
    BotUpdate,
    RegistrationScene,
    AddExpenseScene,
    StatsDetailScene,
    FamilyJoinScene,
  ],
})
export class BotModule {}
