import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  telegramId: number;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  nameNormalized: string;

  @Prop({ type: Types.ObjectId, ref: 'Family', default: null })
  familyId: Types.ObjectId | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
