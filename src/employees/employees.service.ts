import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.employee.findMany();
  }

  findOne(id: string) {
    return this.prisma.employee.findUnique({ where: { id } });
  }

  create(data: Prisma.EmployeeUncheckedCreateInput) {
    return this.prisma.employee.create({ data });
  }

  update(id: string, data: Prisma.EmployeeUncheckedUpdateInput) {
    return this.prisma.employee.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.employee.delete({ where: { id } });
  }
}
