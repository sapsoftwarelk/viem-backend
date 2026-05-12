import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.vehicle.findMany({ include: { subCategory: true, trips: true } });
  }

  findOne(id: string) {
    return this.prisma.vehicle.findUnique({ where: { id }, include: { subCategory: true, trips: true } });
  }

  create(data: { id: string; subCategoryId: number }) {
    return this.prisma.vehicle.create({ data });
  }

  update(id: string, data: { subCategoryId?: number }) {
    return this.prisma.vehicle.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.vehicle.delete({ where: { id } });
  }
}