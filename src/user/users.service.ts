import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

export type RegisterResult =
  | { ok: true; user: UserDocument }
  | { ok: false; reason: 'NAME_TAKEN' };

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  findById(id: Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByTelegramId(telegramId: number): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (user?.name && !user.nameNormalized) {
      const nameNormalized = user.name.trim().toLowerCase();
      await this.userModel.updateOne(
        { _id: user._id },
        { $set: { nameNormalized } },
      );
      return this.userModel.findById(user._id).exec();
    }
    return user;
  }

  async register(telegramId: number, name: string): Promise<RegisterResult> {
    const trimmed = name.trim();
    const nameNormalized = trimmed.toLowerCase();
    const taken = await this.userModel
      .findOne({
        nameNormalized,
        telegramId: { $ne: telegramId },
      })
      .exec();
    if (taken) {
      return { ok: false, reason: 'NAME_TAKEN' };
    }
    const user = await this.userModel.findOneAndUpdate(
      { telegramId },
      { $set: { name: trimmed, nameNormalized } },
      { upsert: true, new: true },
    );
    if (!user) {
      return { ok: false, reason: 'NAME_TAKEN' };
    }
    return { ok: true, user };
  }

  async setFamilyId(
    userId: Types.ObjectId,
    familyId: Types.ObjectId,
  ): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { $set: { familyId } });
  }

  listNamesInFamily(familyId: Types.ObjectId): Promise<string[]> {
    return this.userModel.distinct('name', { familyId }).exec();
  }

  async isNameAmongFamilyMembers(
    familyId: Types.ObjectId,
    name: string,
  ): Promise<boolean> {
    const n = name.trim().toLowerCase();
    const count = await this.userModel
      .countDocuments({
        familyId,
        nameNormalized: n,
      })
      .exec();
    return count > 0;
  }
}
