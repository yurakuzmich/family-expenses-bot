import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomInt } from 'crypto';
import { Model, Types } from 'mongoose';
import { UsersService } from '../user/users.service';
import { Family, FamilyDocument } from './schemas/family.schema';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_LENGTH = 8;

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < INVITE_LENGTH; i++) {
    code += INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)];
  }
  return code;
}

export type CreateFamilyResult =
  | FamilyDocument
  | 'ALREADY_IN_FAMILY'
  | 'USER_NOT_FOUND';

export type JoinFamilyResult =
  | FamilyDocument
  | 'INVALID_CODE'
  | 'ALREADY_IN_FAMILY';

@Injectable()
export class FamiliesService {
  constructor(
    @InjectModel(Family.name) private familyModel: Model<FamilyDocument>,
    private readonly usersService: UsersService,
  ) {}

  async createFamilyForUser(
    userId: Types.ObjectId,
  ): Promise<CreateFamilyResult> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return 'USER_NOT_FOUND';
    }
    if (user.familyId) {
      return 'ALREADY_IN_FAMILY';
    }
    let code = generateInviteCode();
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const family = await this.familyModel.create({
          ownerUserId: userId,
          inviteCode: code,
          memberUserIds: [userId],
        });
        await this.usersService.setFamilyId(userId, family._id);
        return family;
      } catch {
        code = generateInviteCode();
      }
    }
    throw new Error('Could not allocate invite code');
  }

  async joinFamilyByCode(
    rawCode: string,
    userId: Types.ObjectId,
  ): Promise<JoinFamilyResult> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return 'INVALID_CODE';
    }
    if (user.familyId) {
      return 'ALREADY_IN_FAMILY';
    }
    const inviteCode = rawCode.trim().toUpperCase();
    if (inviteCode.length < 4) {
      return 'INVALID_CODE';
    }
    const family = await this.familyModel.findOne({ inviteCode }).exec();
    if (!family) {
      return 'INVALID_CODE';
    }
    await this.familyModel.updateOne(
      { _id: family._id },
      { $addToSet: { memberUserIds: userId } },
    );
    await this.usersService.setFamilyId(userId, family._id);
    return this.familyModel
      .findById(family._id)
      .exec() as Promise<FamilyDocument>;
  }

  findById(id: Types.ObjectId): Promise<FamilyDocument | null> {
    return this.familyModel.findById(id).exec();
  }

  async isOwner(
    familyId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<boolean> {
    const f = await this.familyModel
      .findById(familyId)
      .select('ownerUserId')
      .lean()
      .exec();
    if (!f) {
      return false;
    }
    const ownerId = f.ownerUserId;
    return ownerId.equals(userId);
  }
}
