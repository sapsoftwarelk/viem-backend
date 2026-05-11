import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.item.findMany({ include: { subCategory: true } });
  }

  findOne(id: number) {
    return this.prisma.item.findUnique({ where: { id } });
  }

  create(data: {
    name: string;
    description?: string;
    price?: number;
    subCategoryId: number;
  }) {
    return this.prisma.item.create({ data });
  }

  update(
    id: number,
    data: {
      name?: string;
      description?: string;
      price?: number;
      subCategoryId?: number;
    },
  ) {
    return this.prisma.item.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.item.delete({ where: { id } });
  }
}
