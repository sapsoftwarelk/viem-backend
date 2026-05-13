import { Test, TestingModule } from '@nestjs/testing';
import { GoodsIssueNotesController } from './goods-issue-notes.controller';

describe('GoodsIssueNotesController', () => {
  let controller: GoodsIssueNotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoodsIssueNotesController],
    }).compile();

    controller = module.get<GoodsIssueNotesController>(GoodsIssueNotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
