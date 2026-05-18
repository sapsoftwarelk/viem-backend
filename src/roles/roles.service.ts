import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany();
  }

  findOne(id: string) {
    return this.prisma.role.findUnique({ where: { id } });
  }

  create(data: {
    name: string;
    canCreateUsers?: boolean;
    canRaisePO?: boolean;
    canConfirmDeliveries?: boolean;
    canRunAudits?: boolean;
    canLogMachineHours?: boolean;
  }) {
    return this.prisma.role.create({ data });
  }
}
