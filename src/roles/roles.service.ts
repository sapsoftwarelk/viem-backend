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
    position_title?: string;
    level?: string;
    status?: string;
    description?: string;
  }) {
    return this.prisma.role.create({
      data: {
        name: data.name,
        position_title: data.position_title ?? data.name,
        level: data.level ?? 'STANDARD',
        status: data.status ?? 'ACTIVE',
        description: data.description ?? `${data.name} role`,
        canCreateUsers: data.canCreateUsers ?? false,
        canRaisePO: data.canRaisePO ?? false,
        canConfirmDeliveries: data.canConfirmDeliveries ?? false,
        canRunAudits: data.canRunAudits ?? false,
        canLogMachineHours: data.canLogMachineHours ?? false,
      },
    });
  }
}
