import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubCategoriesService {
  constructor(private prisma: PrismaService) {}

  private readonly defaultCategories = [
    { name: 'Tools', slug: 'tools' },
    { name: 'Reusable', slug: 'reusable' },
    { name: 'Consumables', slug: 'consumable' },
  ];

  private async ensureDefaultCategories() {
    for (const category of this.defaultCategories) {
      const existing = await this.prisma.category.findFirst({ where: { slug: category.slug } });
      if (!existing) {
        await this.prisma.category.create({ data: category });
      }
    }
  }

  async create(data: { name: string; slug: string; code: string; categoryId: number }) {
    await this.ensureDefaultCategories();
    return this.prisma.subCategory.create({
      data,
    });
  }

  async findAll() {
    await this.ensureDefaultCategories();
    return this.prisma.subCategory.findMany({
      include: {
        category: true,
      },
    });
  }
}
