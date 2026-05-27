import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToolStatus, ConsumableBatchStatus } from '@prisma/client';

export type ItemType = 'tool' | 'consumable' | 'reusable';

export interface CreateItemDto {
  type: ItemType;
  subCategoryId: number;
  itemName: string;
  description?: string;
  status?: string;
  locationId?: string;
  supplier?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  quantity?: number;
  maxHours?: number;
  serialNumber?: string;
  bladeType?: string;
  batchDate?: Date;
  unit?: string;
  expiryDate?: Date;
  bundleId?: string;
  pieceCount?: number;
  individualTracking?: boolean;
}

export interface ItemResponse {
  type: ItemType;
  item: any;
}

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateItemDto) {
    if (data.type === 'tool') {
      const quantity = data.quantity && data.quantity > 0 ? data.quantity : 1;
      const createdTools: any[] = [];
      for (let index = 0; index < quantity; index++) {
        const toolId = await this.generateToolId(data.subCategoryId);
        const tool = await this.prisma.tool.create({
          data: {
            id: toolId,
            subCategoryId: data.subCategoryId,
            itemName: data.itemName,
            model: data.itemName,
            description: data.description,
            supplier: data.supplier,
            purchaseDate: data.purchaseDate ?? new Date(),
            warrantyExpiry: data.warrantyExpiry,
            quantity: data.quantity,
            bladeType: data.bladeType,
            serialNumber: data.serialNumber || '',
            condition: 'NEW',
            maxHours: data.maxHours || 0,
            status: data.status ? (data.status as ToolStatus) : undefined,
            locationId: data.locationId,
          },
        });
        createdTools.push(tool);
      }
      return { type: 'tool', item: createdTools.length === 1 ? createdTools[0] : createdTools };
    }

    if (data.type === 'consumable') {
      const batchId = await this.generateConsumableBatchId(data.subCategoryId);
      const batch = await this.prisma.consumableBatch.create({
        data: {
          id: batchId,
          subCategoryId: data.subCategoryId,
          itemName: data.itemName,
          description: data.description,
          supplier: data.supplier,
          purchaseDate: data.purchaseDate ?? new Date(),
          batchDate: data.batchDate,
          receivedDate: new Date(),
          expiryDate: data.expiryDate ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          quantity: data.quantity || 0,
          unit: data.unit,
          status: data.status ? (data.status as ConsumableBatchStatus) : undefined,
          locationId: data.locationId,
        },
      });
      return { type: 'consumable', item: batch };
    }

    if (data.type === 'reusable') {
      const bundleId = data.bundleId || data.itemName;
      const reusableId = await this.generateReusableId(bundleId);
      const reusable = await this.prisma.reusableItem.create({
        data: {
          id: reusableId,
          bundleId,
          itemName: data.itemName,
          description: data.description,
          supplier: data.supplier,
          purchaseDate: data.purchaseDate ?? new Date(),
          status: data.status,
          locationId: data.locationId,
          pieceCount: data.pieceCount || 1,
          individualTracking: data.individualTracking ?? false,
          pieceNum: data.pieceCount || 1,
        },
      });
      return { type: 'reusable', item: reusable };
    }

    throw new BadRequestException('Invalid item type');
  }

  async findAll() {
    const [tools, consumables, reusables] = await Promise.all([
      this.prisma.tool.findMany({ include: { subCategory: true, location: true } }),
      this.prisma.consumableBatch.findMany({ include: { subCategory: true, location: true } }),
      this.prisma.reusableItem.findMany({ include: { location: true } }),
    ]);

    return [
      ...tools.map((item) => ({ type: 'tool', item })),
      ...consumables.map((item) => ({ type: 'consumable', item })),
      ...reusables.map((item) => ({ type: 'reusable', item })),
    ];
  }

  async findOne(id: string) {
    if (id.startsWith('TOOL-')) {
      const tool = await this.prisma.tool.findUnique({
        where: { id },
        include: { subCategory: true, location: true, movements: true, maintenance: true },
      });
      if (!tool) throw new NotFoundException('Tool not found');
      return { type: 'tool', item: tool };
    }

    if (id.startsWith('CONS-')) {
      const consumable = await this.prisma.consumableBatch.findUnique({
        where: { id },
        include: { subCategory: true, location: true },
      });
      if (!consumable) throw new NotFoundException('Consumable batch not found');
      return { type: 'consumable', item: consumable };
    }

    if (id.startsWith('REUS-')) {
      const reusable = await this.prisma.reusableItem.findUnique({
        where: { id },
        include: { location: true },
      });
      if (!reusable) throw new NotFoundException('Reusable item not found');
      return { type: 'reusable', item: reusable };
    }

    throw new NotFoundException('Item not found');
  }

  private async generateToolId(subCategoryId: number): Promise<string> {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });
    if (!subCategory) throw new NotFoundException('SubCategory not found');

    const count = await this.prisma.tool.count({ where: { subCategoryId } });
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
    const count = await this.prisma.reusableItem.count({ where: { bundleId } });
    const sequence = (count + 1).toString().padStart(3, '0');
    return `REUS-${bundleId}-P${sequence}`;
  }
}
