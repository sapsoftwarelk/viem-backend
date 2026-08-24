import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AllocationInput = {
  resourceId: string;
  resourceType: 'EMPLOYEE' | 'VEHICLE';
  status: 'IDLE' | 'ACTIVE' | 'REPAIR' | 'ABSENT';
  locationId?: string | null;
  siteSubId?: string | null;
  updatedBy?: string | null;
};

@Injectable()
export class ResourceAllocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.resourceAllocation.findMany({ 
      orderBy: { updatedAt: 'desc' } 
    });
  }

  async upsertAllocation(data: AllocationInput) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.resourceAllocation.findFirst({
        where: {
          resourceId: data.resourceId,
          resourceType: data.resourceType,
        },
      });

      let result;
      if (existing) {
        result = await tx.resourceAllocation.update({
          where: { id: existing.id },
          data: {
            status: data.status,
            locationId: data.locationId || null,
            siteSubId: data.siteSubId || null,
            updatedBy: data.updatedBy || null,
          },
        });
      } else {
        result = await tx.resourceAllocation.create({
          data: {
            resourceId: data.resourceId,
            resourceType: data.resourceType,
            status: data.status,
            locationId: data.locationId || null,
            siteSubId: data.siteSubId || null,
            updatedBy: data.updatedBy || null,
          },
        });
      }

      await tx.resourceAllocationHistory.create({
        data: {
          resourceId: data.resourceId,
          resourceType: data.resourceType,
          status: data.status,
          locationId: data.locationId || null,
          siteSubId: data.siteSubId || null,
          updatedBy: data.updatedBy || null,
        },
      });

      return result;
    });
  }

  async getHistory(resourceId: string, resourceType: 'EMPLOYEE' | 'VEHICLE') {
    const records = await this.prisma.resourceAllocationHistory.findMany({
      where: {
        resourceId,
        resourceType,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (records.length === 0) {
      return this.prisma.resourceAllocationHistory.findMany({
        where: { resourceId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return records;
  }

  async activeResourcesForSite(
    locationId: string | undefined,
    siteSubId: string | undefined,
    resourceType: 'EMPLOYEE' | 'VEHICLE' = 'EMPLOYEE',
  ) {
    const where: any = { resourceType, status: 'ACTIVE' };
    if (locationId) where.locationId = locationId;
    if (siteSubId) where.siteSubId = siteSubId;

    const allocations = await this.prisma.resourceAllocation.findMany({ where });

    if (resourceType === 'EMPLOYEE') {
      const ids = allocations.map((a) => a.resourceId).filter(Boolean);
      const people = await this.prisma.employee.findMany({ 
        where: { id: { in: ids } } 
      });
      return people.map((p) => ({ id: p.id, name: p.fullName }));
    }

    if (resourceType === 'VEHICLE') {
      const ids = allocations.map((a) => a.resourceId).filter(Boolean);
      const vehicles = await this.prisma.vehicle.findMany({ 
        where: { id: { in: ids } } 
      });
      return vehicles.map((v) => ({
        id: v.id,
        plate: v.registrationNo || v.id,
        model: v.model,
      }));
    }

    return allocations;
  }
}