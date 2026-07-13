import { Module } from '@nestjs/common';
import { ReturnNotesController } from './Return notes.controller';
import { ReturnNotesService } from './Return notes.service';
import { PrismaModule } from '../prisma/prisma.module'; // adjust path if yours differs

@Module({
  imports: [PrismaModule],
  controllers: [ReturnNotesController],
  providers: [ReturnNotesService],
})
export class ReturnNotesModule {}