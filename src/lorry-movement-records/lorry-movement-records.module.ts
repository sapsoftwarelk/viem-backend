import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LorryMovementRecordsController } from './lorry-movement-records.controller';
import { LorryMovementRecordsService } from './lorry-movement-records.service';

@Module({
  imports: [PrismaModule],
  controllers: [LorryMovementRecordsController],
  providers: [LorryMovementRecordsService],
})
export class LorryMovementRecordsModule {}
