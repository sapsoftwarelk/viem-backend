import { Module } from '@nestjs/common';
import { GoodsReceivedNotesController } from './goods-received-notes.controller';
import { GoodsReceivedNotesService } from './goods-received-notes.service';

@Module({
  controllers: [GoodsReceivedNotesController],
  providers: [GoodsReceivedNotesService]
})
export class GoodsReceivedNotesModule {}
