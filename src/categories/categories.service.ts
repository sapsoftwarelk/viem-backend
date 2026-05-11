import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({ include: { subCategories: true } });
  }

  findOne(id: number) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  create(data: { name: string; slug: string }) {
    return this.prisma.category.create({ data });
  }

  update(id: number, data: { name?: string; slug?: string }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.category.delete({ where: { id } });
  }
}
