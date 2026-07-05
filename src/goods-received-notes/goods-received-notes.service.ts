import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocType, ToolStatus, ConsumableBatchStatus } from '@prisma/client';

export interface GRNLineInput {
  id?: string;             // existing GoodsReceivedNoteItem id, if editing
  poLineId?: string;
  itemId?: string;
  itemName: string;
  type?: 'Tool' | 'Consumable' | 'Reusable' | string;
  categoryCode?: string;
  unit?: string;
  qtyOrdered?: number;
  qtyReceived: number;     // cumulative total received to date for this line
  unitPrice?: number;
  isRegistered?: boolean;
  condition?: string;
}

export interface CreateGRNDto {
  poId?: string | null;
  supplier?: string;
  siteLocationId?: string | null;
  receivedBy?: string;
  inspectedBy?: string;
  deliveryNote?: string;
  notes?: string;
  receivedDate?: string | Date;
  status?: string;
  lines: GRNLineInput[];
}

export type UpdateGRNDto = Partial<CreateGRNDto>;

@Injectable()
export class GoodsReceivedNotesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeShape = {
    document: true,
    po: true,
    siteLocation: { select: { id: true, siteName: true } },
    items: true,
  };

  // ───────────────────────────────────────────────────────────────────────
  // Flattens the nested Prisma result into the shape the frontend expects.
  // ───────────────────────────────────────────────────────────────────────
  private toResponse(grn: any) {
    if (!grn) return grn;

    return {
      id: grn.docId,
      grnNumber: grn.docId,
      status: grn.document?.status ?? 'Draft',
      poId: grn.poId ?? '',
      poNumber: grn.poId ?? '',
      linkedPO: Boolean(grn.poId),
      supplier: grn.supplier ?? '',
      site: grn.siteLocation?.siteName ?? '',
      siteLocationId: grn.siteLocationId ?? '',
      receivedBy: grn.receivedBy ?? '',
      inspectedBy: grn.inspectedBy ?? '',
      deliveryNote: grn.deliveryNote ?? '',
      notes: grn.notes ?? '',
      receivedDate: grn.receivedDate,
      createdDate: grn.document?.createdAt,
      lines: (grn.items ?? []).map((item: any) => ({
        id: item.id,
        poLineId: item.poLineId ?? '',
        itemId: item.itemId ?? '',
        itemName: item.itemName,
        type: item.type ?? 'Consumable',
        categoryCode: item.categoryCode ?? '',
        unit: item.unit ?? '',
        qtyOrdered: item.qtyOrdered ?? 0,
        qtyReceived: item.qtyReceived,
        unitPrice: item.unitPrice ?? 0,
        isRegistered: item.isRegistered,
        condition: item.condition ?? 'Good',
      })),
    };
  }

  // ───────────────────────────────────────────────────────────────────────

  async createGRN(userId: string, dto: CreateGRNDto) {
    let po: any = null;

    if (dto.poId) {
      po = await this.prisma.purchaseOrder.findUnique({
        where: { docId: dto.poId },
        include: { document: true },
      });

      if (!po) {
        throw new NotFoundException('Purchase Order not found');
      }

      if (!po.document.isAdminApproved) {
        throw new BadRequestException(
          'Purchase Order must be approved before creating a GRN',
        );
      }

      const existingGRN = await this.prisma.goodsReceivedNote.findUnique({
        where: { poId: dto.poId },
      });

      if (existingGRN) {
        throw new BadRequestException(
          'A GRN already exists for this Purchase Order. Edit that GRN instead of creating a new one.',
        );
      }
    }

    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('At least one line item is required');
    }

    const grnId = await this.generateGRNId();

    const document = await this.prisma.document.create({
      data: {
        id: grnId,
        type: DocType.GRN,
        creatorId: userId,
        status: dto.status || 'Draft',
      },
    });

    await this.prisma.goodsReceivedNote.create({
      data: {
        docId: grnId,
        poId: dto.poId || null,
        supplier: dto.supplier || po?.supplier || '',
        siteLocationId: dto.siteLocationId || null,
        receivedBy: dto.receivedBy || null,
        inspectedBy: dto.inspectedBy || null,
        deliveryNote: dto.deliveryNote || null,
        notes: dto.notes || null,
        receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : new Date(),
      },
    });

    for (const line of dto.lines) {
      const createdLine = await this.prisma.goodsReceivedNoteItem.create({
        data: {
          grnId,
          poLineId: line.poLineId || null,
          itemId: line.itemId || null,
          itemName: line.itemName,
          type: line.type || null,
          categoryCode: line.categoryCode || null,
          unit: line.unit || null,
          qtyOrdered: line.qtyOrdered ?? null,
          qtyReceived: line.qtyReceived || 0,
          unitPrice: line.unitPrice ?? null,
          isRegistered: line.isRegistered ?? false,
          condition: line.condition || 'Good',
        },
      });

      // First creation: the full received quantity is "new" inventory.
      if (createdLine.qtyReceived > 0) {
        await this.createInventoryForLine(
          createdLine,
          createdLine.qtyReceived,
          grnId,
          dto.siteLocationId || null,
          dto.supplier || po?.supplier || '',
        );
      }
    }

    const created = await this.prisma.goodsReceivedNote.findUnique({
      where: { docId: grnId },
      include: this.includeShape,
    });

    return this.toResponse(created);
  }

  async updateGRN(id: string, dto: UpdateGRNDto) {
    const existing = await this.prisma.goodsReceivedNote.findUnique({
      where: { docId: id },
      include: { items: true },
    });

    if (!existing) {
      throw new NotFoundException('GRN not found');
    }

    if (dto.status) {
      await this.prisma.document.update({
        where: { id },
        data: { status: dto.status },
      });
    }

    await this.prisma.goodsReceivedNote.update({
      where: { docId: id },
      data: {
        supplier: dto.supplier ?? undefined,
        siteLocationId:
          dto.siteLocationId !== undefined ? dto.siteLocationId || null : undefined,
        receivedBy: dto.receivedBy ?? undefined,
        inspectedBy: dto.inspectedBy ?? undefined,
        deliveryNote: dto.deliveryNote ?? undefined,
        notes: dto.notes ?? undefined,
        receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : undefined,
      },
    });

    if (dto.lines) {
      const existingById = new Map(existing.items.map((item) => [item.id, item]));
      const keepIds = new Set<string>();
      const effectiveSiteLocationId =
        dto.siteLocationId !== undefined ? dto.siteLocationId : existing.siteLocationId;
      const effectiveSupplier = dto.supplier ?? existing.supplier;

      for (const line of dto.lines) {
        const prior = line.id ? existingById.get(line.id) : undefined;
        const newQty = line.qtyReceived || 0;
        const priorQty = prior?.qtyReceived || 0;
        const delta = newQty - priorQty;

        let savedLine;
        if (prior) {
          keepIds.add(prior.id);
          savedLine = await this.prisma.goodsReceivedNoteItem.update({
            where: { id: prior.id },
            data: {
              poLineId: line.poLineId || null,
              itemId: line.itemId || null,
              itemName: line.itemName,
              type: line.type || null,
              categoryCode: line.categoryCode || null,
              unit: line.unit || null,
              qtyOrdered: line.qtyOrdered ?? null,
              qtyReceived: newQty,
              unitPrice: line.unitPrice ?? null,
              isRegistered: line.isRegistered ?? false,
              condition: line.condition || 'Good',
            },
          });
        } else {
          savedLine = await this.prisma.goodsReceivedNoteItem.create({
            data: {
              grnId: id,
              poLineId: line.poLineId || null,
              itemId: line.itemId || null,
              itemName: line.itemName,
              type: line.type || null,
              categoryCode: line.categoryCode || null,
              unit: line.unit || null,
              qtyOrdered: line.qtyOrdered ?? null,
              qtyReceived: newQty,
              unitPrice: line.unitPrice ?? null,
              isRegistered: line.isRegistered ?? false,
              condition: line.condition || 'Good',
            },
          });
          keepIds.add(savedLine.id);
        }

        // Only create inventory for the newly-arrived quantity (the delta),
        // so re-saving the same GRN doesn't duplicate inventory records.
        if (delta > 0) {
          await this.createInventoryForLine(
            savedLine,
            delta,
            id,
            effectiveSiteLocationId,
            effectiveSupplier,
          );
        }
      }

      // Lines removed from the form are removed from the GRN record.
      // Any inventory already created from them is left untouched —
      // physical goods already received aren't un-received by editing the form.
      const toDelete = existing.items.filter((item) => !keepIds.has(item.id));
      if (toDelete.length > 0) {
        await this.prisma.goodsReceivedNoteItem.deleteMany({
          where: { id: { in: toDelete.map((item) => item.id) } },
        });
      }
    }

    const updated = await this.prisma.goodsReceivedNote.findUnique({
      where: { docId: id },
      include: this.includeShape,
    });

    return this.toResponse(updated);
  }

  async deleteGRN(id: string) {
    const existing = await this.prisma.goodsReceivedNote.findUnique({ where: { docId: id } });
    if (!existing) {
      throw new NotFoundException('GRN not found');
    }

    // Tool/ConsumableBatch/ReusableItem.grnId -> GoodsReceivedNote ON DELETE SET NULL,
    // so already-received inventory stays in the system (unlinked) rather than being destroyed.
    await this.prisma.$transaction([
      this.prisma.goodsReceivedNoteItem.deleteMany({ where: { grnId: id } }),
      this.prisma.goodsReceivedNote.delete({ where: { docId: id } }),
      this.prisma.document.delete({ where: { id } }),
    ]);

    return { success: true, id };
  }

  // ───────────────────────────────────────────────────────────────────────
  // Creates real inventory records for a received quantity delta.
  // ───────────────────────────────────────────────────────────────────────
  private async createInventoryForLine(
    line: { itemName: string; type: string | null; categoryCode: string | null; unit: string | null; condition: string | null },
    quantity: number,
    grnId: string,
    locationId: string | null,
    supplier: string,
  ) {
    const type = (line.type || 'Consumable').toLowerCase();
    const subCategoryId = await this.resolveSubCategoryIdByCode(line.categoryCode);

    if (type === 'tool') {
      const qty = Math.max(1, Math.round(quantity));
      for (let i = 0; i < qty; i++) {
        const toolId = await this.generateToolId(subCategoryId);
        await this.prisma.tool.create({
          data: {
            id: toolId,
            subCategoryId,
            itemName: line.itemName,
            model: line.itemName,
            description: line.condition ? `Condition: ${line.condition}` : undefined,
            supplier,
            purchaseDate: new Date(),
            serialNumber: toolId,
            condition: line.condition || 'NEW',
            maxHours: 0,
            status: ToolStatus.IN_WAREHOUSE,
            locationId: locationId || undefined,
            grnId,
          },
        });
      }
      return;
    }

    if (type === 'reusable') {
      const bundleId = line.itemName;
      const reusableId = await this.generateReusableId(bundleId);
      await this.prisma.reusableItem.create({
        data: {
          id: reusableId,
          bundleId,
          itemName: line.itemName,
          supplier,
          purchaseDate: new Date(),
          status: line.condition || 'Good',
          locationId: locationId || undefined,
          pieceNum: Math.max(1, Math.round(quantity)),
          individualTracking: false,
          grnId,
        },
      });
      return;
    }

    // Default: consumable
    const batchId = await this.generateConsumableBatchId(subCategoryId);
    await this.prisma.consumableBatch.create({
      data: {
        id: batchId,
        subCategoryId,
        itemName: line.itemName,
        supplier,
        purchaseDate: new Date(),
        receivedDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        quantity,
        unit: line.unit || undefined,
        status: ConsumableBatchStatus.AVAILABLE,
        locationId: locationId || undefined,
        grnId,
      },
    });
  }

  // Looks up a SubCategory by its code, creating a fallback "General" category
  // the first time an unrecognized code is received (same convention as ItemsService).
  private async resolveSubCategoryIdByCode(code?: string | null): Promise<number> {
    const rawCode = (code || 'GEN').trim();
    const normalizedCode = rawCode.toUpperCase();

    const existing = await this.prisma.subCategory.findFirst({
      where: { code: { equals: rawCode, mode: 'insensitive' } },
    });
    if (existing) return existing.id;

    let defaultCategory = await this.prisma.category.findFirst({ where: { slug: 'general' } });
    if (!defaultCategory) {
      defaultCategory = await this.prisma.category.create({
        data: { name: 'General', slug: 'general' },
      });
    }

    const slug = rawCode.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'subcategory';

    const created = await this.prisma.subCategory.create({
      data: {
        name: normalizedCode,
        slug,
        code: normalizedCode,
        categoryId: defaultCategory.id,
      },
    });
    return created.id;
  }

  private async generateGRNId(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const count = await this.prisma.document.count({
      where: {
        type: DocType.GRN,
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1,
          ),
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

  private async generateConsumableBatchId(
    subCategoryId: number,
  ): Promise<string> {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });
    if (!subCategory) throw new NotFoundException('SubCategory not found');

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const count = await this.prisma.consumableBatch.count({
      where: {
        subCategoryId,
        receivedDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1,
          ),
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
    const grns = await this.prisma.goodsReceivedNote.findMany({
      include: this.includeShape,
      orderBy: { receivedDate: 'desc' },
    });
    return grns.map((grn) => this.toResponse(grn));
  }

  async findOne(id: string) {
    const grn = await this.prisma.goodsReceivedNote.findUnique({
      where: { docId: id },
      include: this.includeShape,
    });

    if (!grn) {
      throw new NotFoundException('GRN not found');
    }

    return this.toResponse(grn);
  }

  private async createSystemUser() {
    const systemId = 'system-user-id';
    const user = await this.prisma.user.findUnique({ where: { id: systemId } });
    if (user) return user;

    const role = await this.prisma.role.upsert({
      where: { position_title: 'System' },
      update: {},
      create: {
        position_title: 'System',
        level: 'SYSTEM',
        status: 'active',
        description: 'System role',
        canCreateUsers: false,
        canRaisePO: false,
        canConfirmDeliveries: false,
        canRunAudits: false,
        canLogMachineHours: false,
      },
    });

    const employee = await this.prisma.employee.upsert({
      where: { id: 'EMP-SYS-0001' },
      update: { roleId: role.id },
      create: {
        id: 'EMP-SYS-0001',
        fullName: 'System',
        employeeId: 'SYS0001',
        contact: 'system@veims.local',
        department: 'ADM',
        status: 'ACTIVE',
        joinDate: new Date(),
        roleId: role.id,
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
          lt: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1,
          ),
        },
      },
    });
    const dateStr = today.toISOString().split('T')[0];
    return `EXN-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
  }
}