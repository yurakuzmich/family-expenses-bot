import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type ExpenseDocument = HydratedDocument<Expense>;

@Schema({ timestamps: true })
export class Expense {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  userName: string;

  @Prop({ required: true, trim: true })
  expenseName: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  occurredAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Family' })
  familyId?: Types.ObjectId;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

ExpenseSchema.index({ occurredAt: 1 });
ExpenseSchema.index({ userId: 1, occurredAt: 1 });
ExpenseSchema.index({ familyId: 1, occurredAt: 1 });
