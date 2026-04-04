import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { FamiliesService } from './families.service';
import { Family, FamilySchema } from './schemas/family.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Family.name, schema: FamilySchema }]),
    UserModule,
  ],
  providers: [FamiliesService],
  exports: [FamiliesService],
})
export class FamilyModule {}
