import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToolStatus, ConsumableBatchStatus } from '@prisma/client';

export type ItemType = 'tool' | 'consumable' | 'reusable';

export interface CreateItemDto {
  type: ItemType;
  subCategoryId?: number;
  subCategoryCode?: string;
  itemName: string;
  description?: string;
  status?: string;
  location?: string;
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
    const subCategoryId = await this.resolveSubCategoryId(data.subCategoryId, data.subCategoryCode);
    if (data.type === 'tool') {
      const quantity = data.quantity && data.quantity > 0 ? data.quantity : 1;
      const createdTools: any[] = [];
      const locationId = data.locationId || await this.resolveLocation(data.location);

      for (let index = 0; index < quantity; index++) {
        const toolId = await this.generateToolId(subCategoryId);
        const tool = await this.prisma.tool.create({
          data: {
            id: toolId,
            subCategoryId,
            itemName: data.itemName,
            model: data.itemName,
            description: data.description,
            supplier: data.supplier,
            purchaseDate: data.purchaseDate ?? new Date(),
            warrantyExpiry: data.warrantyExpiry,
            bladeType: data.bladeType,
            serialNumber: data.serialNumber || toolId,
            condition: 'PROCURED',
            maxHours: data.maxHours || 0,
            status: this.mapToolStatus(data.status) ?? ToolStatus.IN_WAREHOUSE,
            locationId,
          },
        });
        createdTools.push(tool);
      }
      return { type: 'tool', item: createdTools.length === 1 ? createdTools[0] : createdTools };
    }

    if (data.type === 'consumable') {
      const locationId = data.locationId || await this.resolveLocation(data.location);
      const batchId = await this.generateConsumableBatchId(subCategoryId);
      const batch = await this.prisma.consumableBatch.create({
        data: {
          id: batchId,
          subCategoryId,
          itemName: data.itemName,
          description: data.description,
          supplier: data.supplier,
          purchaseDate: data.purchaseDate ?? new Date(),
          batchDate: data.batchDate,
          receivedDate: new Date(),
          expiryDate: data.expiryDate ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          quantity: data.quantity || 0,
          unit: data.unit,
          status: this.mapConsumableStatus(data.status) ?? ConsumableBatchStatus.AVAILABLE,
          locationId,
        },
      });
      return { type: 'consumable', item: batch };
    }

    if (data.type === 'reusable') {
      const locationId = data.locationId || await this.resolveLocation(data.location);
      const bundleId = data.bundleId || data.itemName;
      const reusableId = await this.generateReusableId(bundleId);
      const reusable = await this.prisma.reusableItem.create({
        data: {
          id: reusableId,
          itemName: data.itemName,
          subCategoryId,
          bundleId,
          description: data.description,
          supplier: data.supplier,
          purchaseDate: data.purchaseDate ?? new Date(),
          status: data.status,
          locationId,
          pieceNum: data.pieceCount || 1,
          individualTracking: data.individualTracking ?? false,
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
      this.prisma.reusableItem.findMany({ include: { subCategory: true, location: true } }),
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
        include: { subCategory: true, location: true },
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

  private mapToolStatus(status?: string): ToolStatus | undefined {
    if (!status) return undefined;
    const normalized = status.toUpperCase().replace(/\s+/g, '_');
    switch (normalized) {
      case 'PROCURED': return ToolStatus.PROCURED;
      case 'IN_WAREHOUSE':
      case 'IN WAREHOUSE':
      case 'ACTIVE':
        return ToolStatus.IN_WAREHOUSE;
      case 'READY': return ToolStatus.READY;
      case 'IN_TRANSIT':
      case 'IN TRANSIT': return ToolStatus.IN_TRANSIT;
      case 'ON_SITE':
      case 'ON SITE':
      case 'IN_USE':
      case 'IN USE': return ToolStatus.ON_SITE;
      case 'RETURN_INITIATED':
      case 'RETURN INITIATED':
      case 'RETURNING': return ToolStatus.RETURNING;
      case 'RECEIVED_AT_WH':
      case 'RECEIVED AT WH': return ToolStatus.RECEIVED_AT_WH;
      case 'DAMAGED': return ToolStatus.DAMAGED;
      case 'IN_REPAIR':
      case 'IN REPAIR': return ToolStatus.IN_REPAIR;
      case 'INSPECTION': return ToolStatus.INSPECTION;
      case 'SCRAPPED': return ToolStatus.SCRAPPED;
      default: return undefined;
    }
  }

  private mapConsumableStatus(status?: string): ConsumableBatchStatus | undefined {
    if (!status) return undefined;
    const normalized = status.toUpperCase().replace(/\s+/g, '_');
    switch (normalized) {
      case 'AVAILABLE':
      case 'ACTIVE': return ConsumableBatchStatus.AVAILABLE;
      case 'DEPLETED':
      case 'OUT_OF_STOCK':
      case 'OUT OF STOCK': return ConsumableBatchStatus.DEPLETED;
      case 'EXPIRED': return ConsumableBatchStatus.EXPIRED;
      default: return undefined;
    }
  }

  private async resolveSubCategoryId(subCategoryId?: number, subCategoryCode?: string): Promise<number> {
    if (subCategoryId) return subCategoryId;
    if (!subCategoryCode) {
      throw new BadRequestException('subCategoryId or subCategoryCode is required');
    }

    const rawCode = subCategoryCode.trim();
    const normalizedCode = rawCode.toUpperCase();
    const slug = rawCode
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'subcategory';

    const existingCategory = await this.prisma.subCategory.findFirst({
      where: {
        OR: [
          { code: normalizedCode },
          { code: { equals: rawCode, mode: 'insensitive' } },
          { slug: { equals: slug, mode: 'insensitive' } },
          { name: { equals: rawCode, mode: 'insensitive' } },
        ],
      },
    });

    if (existingCategory) {
      return existingCategory.id;
    }

    let defaultCategory = await this.prisma.category.findFirst({
      where: { slug: 'general' },
    });

    if (!defaultCategory) {
      defaultCategory = await this.prisma.category.create({
        data: {
          name: 'General',
          slug: 'general',
        },
      });
    }

    const createdCategory = await this.prisma.subCategory.create({
      data: {
        name: normalizedCode,
        slug,
        code: normalizedCode,
        categoryId: defaultCategory.id,
      },
    });

    return createdCategory.id;
  }

  private async resolveLocation(location?: string): Promise<string | undefined> {
    if (!location) return undefined;
    const existing = await this.prisma.siteLocation.findFirst({ where: { siteName: location } });
    if (existing) return existing.id;
    const id = `SITE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const created = await this.prisma.siteLocation.create({ data: { id, siteName: location } });
    return created.id;
  }
}
