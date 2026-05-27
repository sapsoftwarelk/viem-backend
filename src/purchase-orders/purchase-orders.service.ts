import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocType } from '@prisma/client';

export interface CreatePODto {
  supplier: string;
  totalCost: number;
  expectedDate: Date;
  items: POItem[];
}

export interface POItem {
  description: string;
  quantity: number;
  unitPrice: number;
  subCategoryId: number;
}

export interface ApprovePODto {
  approved: boolean;
  comments?: string;
}

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  async createPO(userId: string, dto: CreatePODto) {
    // For testing: create a dummy user if it doesn't exist
    let user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      // Create dummy employee first
      const employee = await this.prisma.employee.upsert({
        where: { id: 'EMP-INV-0001' },
        update: {},
        create: {
          id: 'EMP-INV-0001',
          name: 'Test User',
          employeeId: 'EMP001',
          contact: 'test@example.com',
          department: 'INV',
        },
      });

      // Create dummy role
      let role = await this.prisma.role.findFirst({ where: { position_title: 'Test Role' } });
      if (!role) {
        role = await this.prisma.role.create({
            data: {
              position_title: 'Test Role',
            canCreateUsers: false,
            canRaisePO: true,
            canConfirmDeliveries: false,
            canRunAudits: false,
            canLogMachineHours: false,
          },
        });
      }

      // Create dummy user
      user = await this.prisma.user.create({
        data: {
          id: userId,
          username: 'testuser',
          password: 'hashedpassword', // In real app, this would be hashed
          employeeId: employee.id,
          roleId: role.id,
        },
      });
    }
    // Validate total cost matches items
    const calculatedTotal = dto.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    if (Math.abs(calculatedTotal - dto.totalCost) > 0.01) {
      throw new BadRequestException('Total cost does not match item calculations');
    }

    // Generate PO ID
    const poId = await this.generatePOId();

    // Create document record
    const document = await this.prisma.document.create({
      data: {
        id: poId,
        type: DocType.PO,
        creatorId: userId,
        status: 'PENDING_APPROVAL',
        isAdminApproved: false,
      },
    });

    // Create PO
    const po = await this.prisma.purchaseOrder.create({
      data: {
        docId: poId,
        supplier: dto.supplier,
        totalCost: dto.totalCost,
        expectedDate: dto.expectedDate,
      },
      include: {
        document: true,
      },
    });

    return {
      po,
      document,
      items: dto.items, // Store items for reference (could be expanded to a separate table)
    };
  }

  async approvePO(poId: string, adminUserId: string, dto: ApprovePODto) {
    // Verify PO exists
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { docId: poId },
      include: { document: true },
    });

    if (!po) {
      throw new NotFoundException('Purchase Order not found');
    }

    if (po.document.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('PO is not pending approval');
    }

    // Check if approval is needed (above cost threshold)
    const needsApproval = po.totalCost > 50000; // Configurable threshold

    if (needsApproval && !dto.approved) {
      // Update status to rejected
      await this.prisma.document.update({
        where: { id: poId },
        data: {
          status: 'REJECTED',
          isAdminApproved: false,
        },
      });
    } else {
      // Approve the PO
      await this.prisma.document.update({
        where: { id: poId },
        data: {
          status: 'APPROVED',
          isAdminApproved: true,
        },
      });
    }

    return this.findOne(poId);
  }

  async findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: {
        document: {
          include: {
            creator: {
              include: {
                employee: true,
              },
            },
          },
        },
        grn: true,
      },
      orderBy: {
        document: {
          createdAt: 'desc',
        },
      },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { docId: id },
      include: {
        document: {
          include: {
            creator: {
              include: {
                employee: true,
              },
            },
          },
        },
        grn: {
          include: {
            tools: true,
            consumables: true,
            reusables: true,
          },
        },
      },
    });

    if (!po) {
      throw new NotFoundException('Purchase Order not found');
    }

    return po;
  }

  async findPendingApproval() {
    return this.prisma.purchaseOrder.findMany({
      where: {
        document: {
          status: 'PENDING_APPROVAL',
        },
      },
      include: {
        document: {
          include: {
            creator: {
              include: {
                employee: true,
              },
            },
          },
        },
      },
    });
  }

  private async generatePOId(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '-');
    const count = await this.prisma.document.count({
      where: {
        type: DocType.PO,
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    });
    const sequence = (count + 1).toString().padStart(3, '0');
    return `PO-${dateStr}-${sequence}`;
  }
}
