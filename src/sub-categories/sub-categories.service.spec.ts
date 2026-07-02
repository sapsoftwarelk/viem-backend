import { Test, TestingModule } from '@nestjs/testing';
import { SubCategoriesService } from './sub-categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SubCategoriesService', () => {
  let service: SubCategoriesService;
  let prisma: {
    category: any;
    subCategory: any;
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      subCategory: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubCategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SubCategoriesService>(SubCategoriesService);
  });

  it('creates the default parent categories when loading subcategories', async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    prisma.category.create.mockResolvedValue({ id: 10, name: 'Tools', slug: 'tools' });
    prisma.subCategory.findMany.mockResolvedValue([]);

    await service.findAll();

    expect(prisma.category.create).toHaveBeenCalledWith({
      data: { name: 'Tools', slug: 'tools' },
    });
  });
});
