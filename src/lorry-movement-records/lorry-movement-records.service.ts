import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocType, LMRStatus } from '@prisma/client';

export interface CreateLMRDto {
  vehicleId: string;
  driverId: string;
  originLocationId?: string;
  destinationLocationId?: string;
  expectedReturnTime?: string;
  remarks?: string;
}

export interface UpdateLMRStatusDto {
  status: LMRStatus;
  remarks?: string;
}

export interface UpdateLMRReturnDto {
  actualReturnTime?: string;
  remarks?: string;
}

@Injectable()
export class LorryMovementRecordsService {
  constructor(private prisma: PrismaService) {}

  async createLMR(userId: string, dto: CreateLMRDto) {
    const lmrId = await this.generateLMRId();
    const expectedReturnTime = dto.expectedReturnTime ? new Date(dto.expectedReturnTime) : undefined;

    await this.prisma.document.create({
      data: {
        id: lmrId,
        type: DocType.LMR,
        creatorId: userId,
        status: 'LOADED',
        isAdminApproved: false,
      },
    });

    return this.prisma.lorryMovementRecord.create({
      data: {
        id: lmrId,
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        status: LMRStatus.LOADED,
        originLocationId: dto.originLocationId,
        destinationLocationId: dto.destinationLocationId,
        expectedReturnTime,
        remarks: dto.remarks,
      },
      include: {
        vehicle: true,
        driver: true,
        originLocation: true,
        destinationLocation: true,
        gins: true,
      },
    });
  }

  async findAll() {
    return this.prisma.lorryMovementRecord.findMany({
      include: {
        vehicle: true,
        driver: true,
        originLocation: true,
        destinationLocation: true,
        gins: true,
      },
      orderBy: { departureTime: 'desc' },
    });
  }

  async findOne(id: string) {
    const lmr = await this.prisma.lorryMovementRecord.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
        originLocation: true,
        destinationLocation: true,
        gins: true,
      },
    });
    if (!lmr) {
      throw new NotFoundException('LMR not found');
    }
    return lmr;
  }

  async startTrip(id: string) {
    const lmr = await this.findOne(id);
    if (lmr.status !== LMRStatus.LOADED) {
      throw new BadRequestException('Only LOADED trips can be started');
    }
    return this.prisma.lorryMovementRecord.update({
      where: { id },
      data: {
        status: LMRStatus.IN_TRANSIT,
        departureTime: new Date(),
      },
    });
  }

  async markDelivered(id: string) {
    const lmr = await this.findOne(id);
    if (lmr.status !== LMRStatus.IN_TRANSIT) {
      throw new BadRequestException('Only in-transit trips can be marked delivered');
    }
    return this.prisma.lorryMovementRecord.update({
      where: { id },
      data: {
        status: LMRStatus.DELIVERED,
        arrivalTime: new Date(),
      },
    });
  }

  async markReturned(id: string, dto: UpdateLMRReturnDto) {
    const lmr = await this.findOne(id);
    if (lmr.status !== LMRStatus.DELIVERED && lmr.status !== LMRStatus.RETURNING) {
      throw new BadRequestException('Only delivered or returning trips can be marked returned');
    }
    const actualReturnTime = dto.actualReturnTime ? new Date(dto.actualReturnTime) : new Date();
    return this.prisma.lorryMovementRecord.update({
      where: { id },
      data: {
        status: LMRStatus.RETURNED,
        actualReturnTime,
        remarks: dto.remarks || lmr.remarks,
      },
    });
  }

  async closeTrip(id: string) {
    const lmr = await this.findOne(id);
    if (lmr.status !== LMRStatus.RETURNED) {
      throw new BadRequestException('Only returned trips can be closed');
    }
    return this.prisma.lorryMovementRecord.update({
      where: { id },
      data: {
        status: LMRStatus.CLOSED,
      },
    });
  }

  private async generateLMRId(): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10);
    const count = await this.prisma.lorryMovementRecord.count({
      where: {
        id: {
          startsWith: `LMR-${dateStr}-`,
        },
      },
    });
    return `LMR-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
  }
}
