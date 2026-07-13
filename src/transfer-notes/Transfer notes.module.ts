import { Module } from '@nestjs/common';
import { TransferNotesController } from './Transfer notes.controller';
import { TransferNotesService } from './Transfer notes.service';
import { PrismaModule } from '../prisma/prisma.module'; // adjust path if yours differs

@Module({
  imports: [PrismaModule],
  controllers: [TransferNotesController],
  providers: [TransferNotesService],
})
export class TransferNotesModule {}