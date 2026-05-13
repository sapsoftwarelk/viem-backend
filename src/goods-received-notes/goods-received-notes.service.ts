import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocType } from '@prisma/client';

export interface CreateGRNDto {
  poId: string;
  items: GRNItem[];
}

export interface GRNItem {
  type: 'tool' | 'consumable' | 'reusable';
  subCategoryId: number;
  quantity: number;
  model?: string;
  serialNumber?: string;
  expiryDate?: Date;
  bundleId?: string;
  maxHours?: number;
}

export interface CreatedItem {
  type: string;
  item: any; // Tool | ConsumableBatch | ReusableItem
}

@Injectable()
export class GoodsReceivedNotesService {
  constructor(private prisma: PrismaService) {}

  async createGRN(userId: string, dto: CreateGRNDto) {
    // Verify PO exists and is approved
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { docId: dto.poId },
      include: { document: true },
    });

    if (!po) {
      throw new NotFoundException('Purchase Order not found');
    }

    if (!po.document.isAdminApproved) {
      throw new BadRequestException('Purchase Order must be approved before creating GRN');
    }

    // Check if GRN already exists for this PO
    const existingGRN = await this.prisma.goodsReceivedNote.findUnique({
      where: { poId: dto.poId },
    });

    if (existingGRN) {
      throw new BadRequestException('GRN already exists for this Purchase Order');
    }

    // Generate GRN ID
    const grnId = await this.generateGRNId();

    // Create document record
    const document = await this.prisma.document.create({
      data: {
        id: grnId,
        type: DocType.GRN,
        creatorId: userId,
        status: 'CREATED',
      },
    });

    // Create GRN with items
    const grn = await this.prisma.goodsReceivedNote.create({
      data: {
        docId: grnId,
        poId: dto.poId,
        supplier: po.supplier,
        receivedDate: new Date(),
      },
    });

    // Generate items based on type
    const createdItems: CreatedItem[] = [];
    for (const item of dto.items) {
      if (item.type === 'tool') {
        const toolId = await this.generateToolId(item.subCategoryId);
        const tool = await this.prisma.tool.create({
          data: {
            id: toolId,
            subCategoryId: item.subCategoryId,
            model: item.model || '',
            serialNumber: item.serialNumber || '',
            purchaseDate: new Date(),
            condition: 'NEW',
            maxHours: item.maxHours || 0,
            grnId: grnId,
          },
        });
        createdItems.push({ type: 'tool', item: tool });
      } else if (item.type === 'consumable') {
        const batchId = await this.generateConsumableBatchId(item.subCategoryId);
        const batch = await this.prisma.consumableBatch.create({
          data: {
            id: batchId,
            subCategoryId: item.subCategoryId,
            receivedDate: new Date(),
            expiryDate: item.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
            quantity: item.quantity,
            grnId: grnId,
          },
        });
        createdItems.push({ type: 'consumable', item: batch });
      } else if (item.type === 'reusable') {
        const reusableId = await this.generateReusableId(item.bundleId!);
        const reusable = await this.prisma.reusableItem.create({
          data: {
            id: reusableId,
            bundleId: item.bundleId!,
            pieceNum: 1, // Will need to handle multiple pieces
            grnId: grnId,
          },
        });
        createdItems.push({ type: 'reusable', item: reusable });
      }
    }

    return {
      grn,
      document,
      createdItems,
    };
  }

  private async generateGRNId(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '-');
    const count = await this.prisma.document.count({
      where: {
        type: DocType.GRN,
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    });
    const sequence = (count + 1).toString().padStart(3, '0');
    return `GRN-${dateStr}-${sequence}`;
  }

  private async generateToolId(subCategoryId: number): Promise<string> {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });
    if (!subCategory) throw new NotFoundException('SubCategory not found');

    const count = await this.prisma.tool.count({
      where: { subCategoryId },
    });
    const sequence = (count + 1).toString().padStart(4, '0');
    return `TOOL-${subCategory.code}-${sequence}`;
  }

  private async generateConsumableBatchId(subCategoryId: number): Promise<string> {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });
    if (!subCategory) throw new NotFoundException('SubCategory not found');

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '-');
    const count = await this.prisma.consumableBatch.count({
      where: {
        subCategoryId,
        receivedDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    });
    const sequence = (count + 1).toString().padStart(3, '0');
    return `CONS-${subCategory.code}-${dateStr}-${sequence}`;
  }

  private async generateReusableId(bundleId: string): Promise<string> {
    const count = await this.prisma.reusableItem.count({
      where: { bundleId },
    });
    const sequence = (count + 1).toString().padStart(3, '0');
    return `REUS-${bundleId}-P${sequence}`;
  }

  async findAll() {
    return this.prisma.goodsReceivedNote.findMany({
      include: {
        document: true,
        po: true,
        tools: true,
        consumables: true,
        reusables: true,
      },
    });
  }

  async findOne(id: string) {
    const grn = await this.prisma.goodsReceivedNote.findUnique({
      where: { docId: id },
      include: {
        document: true,
        po: true,
        tools: true,
        consumables: true,
        reusables: true,
      },
    });

    if (!grn) {
      throw new NotFoundException('GRN not found');
    }

    return grn;
  }

  private async createSystemUser() {
    const systemId = 'system-user-id';
    const user = await this.prisma.user.findUnique({ where: { id: systemId } });
    if (user) return user;

    const employee = await this.prisma.employee.upsert({
      where: { id: 'EMP-SYS-0001' },
      update: {},
      create: {
        id: 'EMP-SYS-0001',
        name: 'System',
        employeeId: 'SYS0001',
        contact: 'system@veims.local',
        department: 'ADM',
      },
    });

    const role = await this.prisma.role.upsert({
      where: { name: 'System' },
      update: {},
      create: {
        name: 'System',
        canCreateUsers: false,
        canRaisePO: false,
        canConfirmDeliveries: false,
        canRunAudits: false,
        canLogMachineHours: false,
      },
    });

    return this.prisma.user.create({
      data: {
        id: systemId,
        username: 'system',
        password: 'system',
        employeeId: employee.id,
        roleId: role.id,
      },
    });
  }

  async expireConsumableBatches() {
    const systemUser = await this.createSystemUser();
    const now = new Date();
    const batches = await this.prisma.consumableBatch.findMany({
      where: {
        expiryDate: { lt: now },
        status: 'AVAILABLE',
      },
    });

    const results: string[] = [];
    for (const batch of batches) {
      await this.prisma.consumableBatch.update({
        where: { id: batch.id },
        data: { status: 'EXPIRED' },
      });

      const noteId = await this.generateExpiryNoteId();
      await this.prisma.document.create({
        data: {
          id: noteId,
          type: DocType.EXN,
          creatorId: systemUser.id,
          status: 'EXPIRED',
          isAdminApproved: false,
        },
      });
      await this.prisma.expiryNote.create({
        data: {
          docId: noteId,
          batchId: batch.id,
          action: 'Auto-expired due to expiry date',
        },
      });
      results.push(batch.id);
    }

    return results;
  }

  private async generateExpiryNoteId(): Promise<string> {
    const today = new Date();
    const count = await this.prisma.document.count({
      where: {
        type: DocType.EXN,
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    });
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '-');
    return `EXN-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
  }
}
