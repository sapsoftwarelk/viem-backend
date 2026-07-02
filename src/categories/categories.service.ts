import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
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

  async findAll() {
    await this.ensureDefaultCategories();
    return this.prisma.category.findMany({ include: { subCategories: true } });
  }

  findOne(id: number) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async create(data: { name: string; slug: string }) {
    await this.ensureDefaultCategories();
    return this.prisma.category.create({ data });
  }

  update(id: number, data: { name?: string; slug?: string }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.category.delete({ where: { id } });
  }
}