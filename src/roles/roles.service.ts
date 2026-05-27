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
    position_title: string;
    level: string;
    status: string;
    description: string;

    canCreateUsers?: boolean;
    canRaisePO?: boolean;
    canConfirmDeliveries?: boolean;
    canRunAudits?: boolean;
    canLogMachineHours?: boolean;
  }) {
    const createData: any = { ...data };
    // Ensure `name` is not sent to DB (schema no longer has `name`).
    delete createData.name;
    return this.prisma.role.create({ data: createData });
  }
}
