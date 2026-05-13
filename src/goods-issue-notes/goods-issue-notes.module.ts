import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GoodsIssueNotesController } from './goods-issue-notes.controller';
import { GoodsIssueNotesService } from './goods-issue-notes.service';

@Module({
  imports: [PrismaModule],
  controllers: [GoodsIssueNotesController],
  providers: [GoodsIssueNotesService],
})
export class GoodsIssueNotesModule {}
