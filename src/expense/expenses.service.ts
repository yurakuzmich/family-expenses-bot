import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from './schemas/expense.schema';

export type UserTotalRow = { userName: string; totalAmount: number };

export type DetailRow = {
  expenseName: string;
  occurredAt: Date;
  amount: number;
};

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
  ) {}

  async create(
    userId: Types.ObjectId,
    userName: string,
    expenseName: string,
    amount: number,
    familyId: Types.ObjectId,
    occurredAt: Date = new Date(),
  ): Promise<ExpenseDocument> {
    return this.expenseModel.create({
      userId,
      userName,
      expenseName,
      amount,
      occurredAt,
      familyId,
    });
  }

  async totalsByUserInFamilySince(
    from: Date,
    to: Date,
    familyId: Types.ObjectId,
  ): Promise<UserTotalRow[]> {
    const rows = await this.expenseModel
      .aggregate<{ _id: string; total: number }>([
        {
          $match: {
            familyId,
            occurredAt: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: '$userName',
            total: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();
    return rows.map((r) => ({
      userName: r._id,
      totalAmount: r.total,
    }));
  }

  async detailsByUserNameInFamilySince(
    userName: string,
    from: Date,
    to: Date,
    familyId: Types.ObjectId,
  ): Promise<DetailRow[]> {
    const docs = await this.expenseModel
      .find({
        familyId,
        userName: new RegExp(`^${escapeRegex(userName)}$`, 'i'),
        occurredAt: { $gte: from, $lte: to },
      })
      .sort({ occurredAt: 1 })
      .select('expenseName occurredAt amount')
      .lean()
      .exec();
    return docs.map((d) => ({
      expenseName: d.expenseName,
      occurredAt: d.occurredAt,
      amount: d.amount,
    }));
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
