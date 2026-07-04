import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createPurchaseOrder(dto: any, creatorId: string) {
    const poId = (typeof dto?.docId === 'string' && dto.docId.trim() !== '') 
      ? dto.docId 
      : `PO-${Date.now()}`; 

    return await this.prisma.document.create({
      data: {
        id: poId,
        type: 'PO',
        status: 'PENDING',
        isAdminApproved: false,
        creatorId: creatorId,
        poDetails: {
          create: {
            supplier: dto.supplier,
            totalCost: dto.totalCost,
            expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : new Date(),
          },
        },
      },
      include: {
        poDetails: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.document.findMany({
      where: {
        type: 'PO', 
      },
      include: {
        poDetails: true, // Retaining valid schema relation
        creator: {
          select: {
            id: true,
            username: true,
            employee: {
              select: {
                fullName: true,
                employeeId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findPendingApproval() {
    return await this.prisma.document.findMany({
      where: {
        type: 'PO',
        status: 'PENDING',
      },
      include: {
        poDetails: true,
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.document.findUnique({
      where: { id },
      include: {
        poDetails: true,
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!po || po.type !== 'PO') {
      throw new NotFoundException(`Purchase Order with ID ${id} not found.`);
    }

    return po;
  }

  async rejectPurchaseOrder(poId: string) {
    await this.findOne(poId);

    return await this.prisma.document.update({
      where: { id: poId },
      data: {
        status: 'REJECTED',
        isAdminApproved: false,
      },
      include: {
        poDetails: true,
      },
    });
  }

  async approvePurchaseOrder(poId: string) {
    await this.findOne(poId);

    return await this.prisma.document.update({
      where: { id: poId },
      data: {
        status: 'APPROVED',
        isAdminApproved: true,
      },
      include: {
        poDetails: true,
      },
    });
  }
}