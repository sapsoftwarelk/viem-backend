import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({ include: { employee: true, role: true } });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { employee: true, role: true } });
  }

  create(data: {
    username: string;
    password: string;
    employeeId: string;
    roleId: string;
    isActive?: boolean;
  }) {
    return this.prisma.user.create({ data });
  }

  update(
    id: string,
    data: {
      username?: string;
      password?: string;
      roleId?: string;
      isActive?: boolean;
    },
  ) {
    return this.prisma.user.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
