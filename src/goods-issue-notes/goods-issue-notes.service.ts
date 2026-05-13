import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocType, GINItemType, GINStatus } from '@prisma/client';

export interface CreateGINItemDto {
  itemType: 'TOOL' | 'CONSUMABLE' | 'REUSABLE';
  itemId: string;
  quantity: number;
}

export interface CreateGINDto {
  items: CreateGINItemDto[];
  isSiteDirect?: boolean;
  siteLocationId?: string;
}

@Injectable()
export class GoodsIssueNotesService {
  constructor(private prisma: PrismaService) {}

  async createGIN(userId: string, dto: CreateGINDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('GIN must include at least one item');
    }

    // Create document
    const ginId = await this.generateGINId();
    await this.prisma.document.create({
      data: {
        id: ginId,
        type: DocType.GIN,
        creatorId: userId,
        status: 'DRAFT',
        isAdminApproved: false,
      },
    });

    const gin = await this.prisma.goodsIssueNote.create({
      data: {
        docId: ginId,
        isSiteDirect: dto.isSiteDirect || false,
        siteLocationId: dto.siteLocationId,
      },
    });

    const items = await Promise.all(
      dto.items.map(async (item) => {
        await this.validateItem(item);
        return this.prisma.goodsIssueNoteItem.create({
          data: {
            ginId,
            itemType: item.itemType as GINItemType,
            toolId: item.itemType === 'TOOL' ? item.itemId : null,
            consumableId: item.itemType === 'CONSUMABLE' ? item.itemId : null,
            reusableId: item.itemType === 'REUSABLE' ? item.itemId : null,
            quantity: item.quantity,
          },
        });
      }),
    );

    return { gin, items };
  }

  async findAll() {
    return this.prisma.goodsIssueNote.findMany({
      include: {
        document: true,
        items: true,
        lmr: true,
        siteLocation: true,
      },
      orderBy: {
        document: {
          createdAt: 'desc',
        },
      },
    });
  }

  async findOne(id: string) {
    const gin = await this.prisma.goodsIssueNote.findUnique({
      where: { docId: id },
      include: {
        document: true,
        items: true,
        lmr: true,
        siteLocation: true,
      },
    });
    if (!gin) {
      throw new NotFoundException('GIN not found');
    }
    return gin;
  }

  async markReady(id: string) {
    const gin = await this.findOne(id);
    if (gin.status !== GINStatus.DRAFT) {
      throw new BadRequestException('GIN can only be moved to READY from DRAFT');
    }
    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.READY,
        readyAt: new Date(),
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'READY' },
    });
    return result;
  }

  async confirmLoading(id: string, vehicleId: string, driverId: string) {
    const gin = await this.findOne(id);
    if (gin.status !== GINStatus.READY) {
      throw new BadRequestException('GIN must be READY before loading');
    }

    const lmrId = await this.generateLMRId();
    await this.prisma.document.create({
      data: {
        id: lmrId,
        type: DocType.LMR,
        creatorId: driverId,
        status: 'IN_TRANSIT',
        isAdminApproved: false,
      },
    });

    await this.prisma.lorryMovementRecord.create({
      data: {
        id: lmrId,
        vehicleId,
        driverId,
        departureTime: new Date(),
      },
    });

    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.IN_TRANSIT,
        inTransitAt: new Date(),
        lmrId,
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'IN_TRANSIT' },
    });
    return result;
  }

  async confirmDelivery(id: string) {
    const gin = await this.findOne(id);
    if (gin.status !== GINStatus.IN_TRANSIT) {
      throw new BadRequestException('GIN must be IN_TRANSIT before delivery');
    }
    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'DELIVERED' },
    });
    return result;
  }

  async reportDiscrepancy(id: string) {
    const gin = await this.findOne(id);
    if (gin.status !== GINStatus.DELIVERED) {
      throw new BadRequestException('Discrepancy can only be reported after delivery');
    }
    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.DISCREPANCY,
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'DISCREPANCY' },
    });
    return result;
  }

  async initiateReturn(id: string) {
    const gin = await this.findOne(id);
    if (gin.status !== GINStatus.DELIVERED && gin.status !== GINStatus.DISCREPANCY) {
      throw new BadRequestException('Return can only be initiated after delivery or discrepancy');
    }
    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.RETURNING,
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'RETURNING' },
    });
    return result;
  }

  async startReturnTransit(id: string) {
    const gin = await this.findOne(id);
    if (gin.status !== GINStatus.RETURNING) {
      throw new BadRequestException('Return transit can only start after return is initiated');
    }
    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.RTN_TRANSIT,
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'RTN_TRANSIT' },
    });
    return result;
  }

  async receiveAtWarehouse(id: string) {
    const gin = await this.findOne(id);
    if (gin.status !== GINStatus.RTN_TRANSIT) {
      throw new BadRequestException('Warehouse receive can only happen after return transit');
    }
    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.RECEIVED_AT_WH,
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'RECEIVED_AT_WH' },
    });
    return result;
  }

  async close(id: string) {
    const gin = await this.findOne(id);
    if (gin.status !== GINStatus.DELIVERED && gin.status !== GINStatus.RECEIVED_AT_WH) {
      throw new BadRequestException('GIN can only be closed after delivery or warehouse receipt');
    }
    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.CLOSED,
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
    return result;
  }

  private async validateItem(item: CreateGINItemDto) {
    if (item.quantity <= 0) {
      throw new BadRequestException('Item quantity must be greater than zero');
    }
    if (item.itemType === 'TOOL') {
      const tool = await this.prisma.tool.findUnique({ where: { id: item.itemId } });
      if (!tool) throw new NotFoundException('Tool not found');
    }
    if (item.itemType === 'CONSUMABLE') {
      const batch = await this.prisma.consumableBatch.findUnique({ where: { id: item.itemId } });
      if (!batch) throw new NotFoundException('Consumable batch not found');
    }
    if (item.itemType === 'REUSABLE') {
      const reusable = await this.prisma.reusableItem.findUnique({ where: { id: item.itemId } });
      if (!reusable) throw new NotFoundException('Reusable item not found');
    }
  }

  private async generateGINId(): Promise<string> {
    const today = new Date();
    const count = await this.prisma.document.count({
      where: {
        type: DocType.GIN,
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    });
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '-');
    return `GIN-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
  }

  private async generateLMRId(): Promise<string> {
    const today = new Date();
    const count = await this.prisma.document.count({
      where: {
        type: DocType.LMR,
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    });
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '-');
    return `LMR-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
  }
}
