import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type FamilyDocument = HydratedDocument<Family>;

@Schema({ timestamps: true })
export class Family {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  ownerUserId: Types.ObjectId;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  inviteCode: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }], default: [] })
  memberUserIds: Types.ObjectId[];
}

export const FamilySchema = SchemaFactory.createForClass(Family);
