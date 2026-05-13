import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToolStatus } from '@prisma/client';

export interface UpdateToolStatusDto {
  status: ToolStatus;
  locationId?: string;
}

export interface LogMachineHoursDto {
  hours: number;
  note?: string;
}

export interface RecordMovementDto {
  location: string;
}

@Injectable()
export class ToolsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tool.findMany({
      include: {
        subCategory: true,
        location: true,
        movements: true,
        maintenance: true,
      },
    });
  }

  async findOne(id: string) {
    const tool = await this.prisma.tool.findUnique({
      where: { id },
      include: {
        subCategory: true,
        location: true,
        movements: true,
        maintenance: true,
      },
    });

    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

    return tool;
  }

  async updateStatus(id: string, dto: UpdateToolStatusDto) {
    const tool = await this.prisma.tool.findUnique({ where: { id } });
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

    const transitionMap: Record<ToolStatus, ToolStatus[]> = {
      PROCURED: [ToolStatus.IN_WAREHOUSE, ToolStatus.READY],
      IN_WAREHOUSE: [ToolStatus.READY, ToolStatus.IN_TRANSIT, ToolStatus.DAMAGED, ToolStatus.SCRAPPED],
      READY: [ToolStatus.IN_TRANSIT, ToolStatus.IN_WAREHOUSE, ToolStatus.DAMAGED, ToolStatus.IN_REPAIR],
      IN_TRANSIT: [ToolStatus.ON_SITE, ToolStatus.RETURN_INITIATED, ToolStatus.DAMAGED],
      ON_SITE: [ToolStatus.RETURN_INITIATED, ToolStatus.IN_REPAIR, ToolStatus.INSPECTION],
      RETURN_INITIATED: [ToolStatus.RETURNING],
      RETURNING: [ToolStatus.RECEIVED_AT_WH],
      RECEIVED_AT_WH: [ToolStatus.IN_WAREHOUSE, ToolStatus.INSPECTION],
      DAMAGED: [ToolStatus.IN_REPAIR, ToolStatus.SCRAPPED],
      IN_REPAIR: [ToolStatus.IN_WAREHOUSE, ToolStatus.INSPECTION],
      INSPECTION: [ToolStatus.IN_WAREHOUSE, ToolStatus.IN_REPAIR],
      SCRAPPED: [],
    };

    const allowed = transitionMap[tool.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Tool status cannot transition from ${tool.status} to ${dto.status}`);
    }

    return this.prisma.tool.update({
      where: { id },
      data: {
        status: dto.status,
        locationId: dto.locationId ?? tool.locationId,
      },
    });
  }

  async logMachineHours(id: string, dto: LogMachineHoursDto) {
    if (dto.hours <= 0) {
      throw new BadRequestException('Machine hours must be greater than zero');
    }

    const tool = await this.prisma.tool.findUnique({ where: { id } });
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

    if (tool.maxHours > 0 && tool.cumulativeHours + dto.hours > tool.maxHours) {
      throw new BadRequestException('Machine hour limit exceeded for this tool');
    }

    return this.prisma.tool.update({
      where: { id },
      data: {
        cumulativeHours: { increment: dto.hours },
      },
    });
  }

  async recordMovement(id: string, dto: RecordMovementDto) {
    if (!dto.location) {
      throw new BadRequestException('Movement location is required');
    }

    const tool = await this.prisma.tool.findUnique({ where: { id } });
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

    return this.prisma.movementHistory.create({
      data: {
        toolId: id,
        location: dto.location,
      },
    });
  }
}
