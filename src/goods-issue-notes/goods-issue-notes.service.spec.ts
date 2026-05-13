import { Test, TestingModule } from '@nestjs/testing';
import { GoodsIssueNotesService } from './goods-issue-notes.service';

describe('GoodsIssueNotesService', () => {
  let service: GoodsIssueNotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoodsIssueNotesService],
    }).compile();

    service = module.get<GoodsIssueNotesService>(GoodsIssueNotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
