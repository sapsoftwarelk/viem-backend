import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GoodsReceivedNotesController } from './goods-received-notes.controller';
import { GoodsReceivedNotesService } from './goods-received-notes.service';

@Module({
  imports: [PrismaModule],
  controllers: [GoodsReceivedNotesController],
  providers: [GoodsReceivedNotesService],
  exports: [GoodsReceivedNotesService], 
})
export class GoodsReceivedNotesModule {}