import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; slug: string; code: string; categoryId: number }) {
    return this.prisma.subCategory.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.subCategory.findMany({
      include: {
        category: true,
      },
    });
  }
}
