import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────────────────
  // Shared include shape so every query returns the same nested data
  // ───────────────────────────────────────────────────────────────────────
  private readonly includeShape = {
    poDetails: {
      include: {
        items: true,
        siteLocation: {
          select: {
            id: true,
            siteName: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    },
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
  };

  // ───────────────────────────────────────────────────────────────────────
  // Flattens the nested Prisma result into the shape the frontend expects:
  // { id, supplier, totalCost, expectedDate, status, items: [...], ... }
  // ───────────────────────────────────────────────────────────────────────
  private toResponse(po: any) {
    if (!po) return po;

    return {
      id: po.id,
      docId: po.id,
      type: po.type,
      status: po.status,
      isAdminApproved: po.isAdminApproved,
      createdAt: po.createdAt,

      supplierId: po.poDetails?.supplier?.id ?? '',
      supplier: po.poDetails?.supplier?.name ?? '',
      siteLocationId: po.poDetails?.siteLocationId ?? '',
      site: po.poDetails?.siteLocation?.siteName ?? '',
      totalCost: po.poDetails?.totalCost ?? 0,
      expectedDate: po.poDetails?.expectedDate ?? null,

      requestedBy:
        po.creator?.employee?.fullName || po.creator?.username || '',
      creator: po.creator ?? null,

      items: (po.poDetails?.items ?? []).map((item: any) => ({
        id: item.id,
        itemId: item.itemId ?? '',
        itemName: item.description,
        description: item.description,
        type: item.type ?? 'Consumable',
        categoryCode: item.categoryCode ?? '',
        unit: item.unit ?? '',
        quantity: item.quantity,
        receivedQty: item.receivedQty,
        unitPrice: item.unitPrice,
        subCategoryId: item.subCategoryId ?? null,
      })),
    };
  }

  // ───────────────────────────────────────────────────────────────────────

  async createPurchaseOrder(dto: any, creatorId: string) {
    const poId =
      typeof dto?.docId === 'string' && dto.docId.trim() !== ''
        ? dto.docId
        : `PO-${Date.now()}`;

    const lineItems = Array.isArray(dto?.items) ? dto.items : [];

    const created = await this.prisma.document.create({
      data: {
        id: poId,
        type: 'PO',
        status: 'PENDING',
        isAdminApproved: false,
        creatorId: creatorId,
        poDetails: {
          create: {
            supplierId: dto.supplierId,
            siteLocationId: dto.siteLocationId || null,
            totalCost: dto.totalCost,
            expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : new Date(),
            items: {
              create: lineItems.map((line: any) => ({
                itemId: line.itemId || null,
                description: line.description || line.itemName || 'Item',
                type: line.type || null,
                categoryCode: line.categoryCode || null,
                unit: line.unit || null,
                quantity: Number(line.quantity ?? line.qtyOrdered ?? 1),
                unitPrice: Number(line.unitPrice ?? 0),
                subCategoryId:
                  line.subCategoryId !== undefined && line.subCategoryId !== null
                    ? Number(line.subCategoryId)
                    : null,
              })),
            },
          },
        },
      },
      include: this.includeShape,
    });

    return this.toResponse(created);
  }

  async findAll() {
    const pos = await this.prisma.document.findMany({
      where: {
        type: 'PO',
      },
      include: this.includeShape,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return pos.map((po) => this.toResponse(po));
  }

  async findPendingApproval() {
    const pos = await this.prisma.document.findMany({
      where: {
        type: 'PO',
        status: 'PENDING',
      },
      include: this.includeShape,
      orderBy: {
        createdAt: 'asc',
      },
    });

    return pos.map((po) => this.toResponse(po));
  }

  async findOne(id: string) {
    const po = await this.prisma.document.findUnique({
      where: { id },
      include: this.includeShape,
    });

    if (!po || po.type !== 'PO') {
      throw new NotFoundException(`Purchase Order with ID ${id} not found.`);
    }

    return this.toResponse(po);
  }

  private async assertExists(poId: string) {
    const po = await this.prisma.document.findUnique({ where: { id: poId } });
    if (!po || po.type !== 'PO') {
      throw new NotFoundException(`Purchase Order with ID ${poId} not found.`);
    }
  }

  async rejectPurchaseOrder(poId: string) {
    await this.assertExists(poId);

    const updated = await this.prisma.document.update({
      where: { id: poId },
      data: {
        status: 'REJECTED',
        isAdminApproved: false,
      },
      include: this.includeShape,
    });

    return this.toResponse(updated);
  }

  async approvePurchaseOrder(poId: string) {
    await this.assertExists(poId);

    const updated = await this.prisma.document.update({
      where: { id: poId },
      data: {
        status: 'APPROVED',
        isAdminApproved: true,
      },
      include: this.includeShape,
    });

    return this.toResponse(updated);
  }

  async deletePurchaseOrder(poId: string) {
    await this.assertExists(poId);

    // A GoodsReceivedNote references PurchaseOrder.docId with ON DELETE RESTRICT,
    // so deleting a PO that already has a GRN would fail at the DB level anyway.
    // Check first so we can return a clear, friendly error instead of a raw FK violation.
    const grn = await this.prisma.goodsReceivedNote.findUnique({ where: { poId } });
    if (grn) {
      throw new BadRequestException(
        'This Purchase Order already has a Goods Received Note and cannot be deleted.',
      );
    }

    // PurchaseOrder.docId -> Document.id is also ON DELETE RESTRICT, so the
    // PurchaseOrder row (and its items, which cascade) must go first, then Document.
    await this.prisma.$transaction([
      this.prisma.purchaseOrder.delete({ where: { docId: poId } }),
      this.prisma.document.delete({ where: { id: poId } }),
    ]);

    return { success: true, id: poId };
  }
}