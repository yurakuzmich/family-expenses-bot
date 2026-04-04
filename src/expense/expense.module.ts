import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { Expense, ExpenseSchema } from './schemas/expense.schema';
import { ExpensesService } from './expenses.service';
import { ExpenseParserService } from './expense-parser.service';
import { MonthRangeService } from './month-range.service';
import { StatisticsPresenterService } from './statistics-presenter.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Expense.name, schema: ExpenseSchema }]),
    UserModule,
  ],
  providers: [
    ExpensesService,
    ExpenseParserService,
    MonthRangeService,
    StatisticsPresenterService,
  ],
  exports: [
    ExpensesService,
    ExpenseParserService,
    MonthRangeService,
    StatisticsPresenterService,
    MongooseModule,
  ],
})
export class ExpenseModule {}
