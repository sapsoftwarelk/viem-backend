import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService } from './items.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ItemsService', () => {
  let service: ItemsService;
  let prisma: { subCategory: any };

  beforeEach(async () => {
    prisma = {
      subCategory: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      category: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
  });

  it('resolves a subcategory by code even when the code is lowercase', async () => {
    prisma.subCategory.findUnique.mockResolvedValue(null);
    prisma.subCategory.findFirst.mockResolvedValue({ id: 42, code: 'DRL' });

    const result = await (service as any).resolveSubCategoryId(undefined, 'drl');

    expect(result).toBe(42);
    expect(prisma.subCategory.findFirst).toHaveBeenCalled();
  });
});
