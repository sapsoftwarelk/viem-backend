import { Module } from '@nestjs/common';
import { RepairNotesController } from './Repair notes.controller';
import { RepairNotesService } from './Repair notes.service';
import { PrismaModule } from '../prisma/prisma.module'; // adjust path if yours differs

@Module({
  imports: [PrismaModule],
  controllers: [RepairNotesController],
  providers: [RepairNotesService],
})
export class RepairNotesModule {}
