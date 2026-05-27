import { Injectable } from '@nestjs/common';
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

  create(data: {
    fullName: string;
    employeeId: string;
    contact: string;
    department: string;
    photoUrl?: string;
    status?: string;
    joinDate?: Date;
    roleId?: string;
  }) {
    return this.prisma.employee.create({ data });
  }

  update(
    id: string,
    data: {
      fullName?: string;
      employeeId?: string;
      contact?: string;
      department?: string;
      photoUrl?: string;
      status?: string;
      joinDate?: Date;
      roleId?: string;
    },
  ) {
    return this.prisma.employee.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.employee.delete({ where: { id } });
  }
}
