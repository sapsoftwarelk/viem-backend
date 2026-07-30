import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoodsReceivedNotesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    docId?: string;
    poId?: string | null;
    supplierId: string; 
    siteLocationId?: string | null;
    receivedBy?: string | null;
    inspectedBy?: string | null;
    deliveryNote?: string | null;
    notes?: string | null;
    receivedDate?: Date;
    items: {
      poLineId?: string | null;
      itemId?: string | null;
      itemName: string;
      type?: string | null;
      categoryCode?: string | null;
      unit?: string | null;
      qtyOrdered?: number | null;
      qtyReceived: number;
      unitPrice?: number | null;
      isRegistered?: boolean;
      condition?: string | null;
    }[];
  }, creatorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const docId =
        typeof data.docId === 'string' && data.docId.trim() !== ''
          ? data.docId.trim()
          : `GRN-${Date.now()}`;

      let supplierId =
        typeof data.supplierId === 'string' ? data.supplierId.trim() : '';

      if (data.poId) {
        const po = await tx.purchaseOrder.findUnique({
          where: { docId: data.poId },
          select: { supplierId: true },
        });
        if (!po) {
          throw new NotFoundException(`Purchase Order with ID ${data.poId} not found.`);
        }
        supplierId = po.supplierId;
      }

      if (!supplierId) {
        throw new BadRequestException('A supplier must be selected for a standalone GRN.');
      }

      const supplier = await tx.supplier.findUnique({
        where: { id: supplierId },
        select: { id: true },
      });
      if (!supplier) {
        throw new BadRequestException('The selected supplier no longer exists. Please select another supplier.');
      }

      await tx.document.create({
        data: {
          id: docId,
          type: 'GRN',
          status: 'PENDING',
          isAdminApproved: false,
          creatorId,
        },
      });

      const grn = await tx.goodsReceivedNote.create({
        data: {
          docId,
          poId: data.poId || null,
          supplierId,
          siteLocationId: data.siteLocationId || null,
          receivedBy: data.receivedBy || null,
          inspectedBy: data.inspectedBy || null,
          deliveryNote: data.deliveryNote || null,
          notes: data.notes || null,
          receivedDate: data.receivedDate || new Date(),
        },
      });

      if (data.items && data.items.length > 0) {
        await tx.goodsReceivedNoteItem.createMany({
          data: data.items.map((item) => ({
            grnId: grn.docId,
            poLineId: item.poLineId || null,
            itemId: item.itemId || null,
            itemName: item.itemName,
            type: item.type || null,
            categoryCode: item.categoryCode || null,
            unit: item.unit || null,
            qtyOrdered: item.qtyOrdered || 0,
            qtyReceived: item.qtyReceived,
            unitPrice: item.unitPrice || 0,
            isRegistered: item.isRegistered || false,
            condition: item.condition || null,
          })),
        });
      }

      return tx.goodsReceivedNote.findUnique({
        where: { docId: grn.docId },
        include: { items: true, supplier: true }, 
      });
    });
  }

  async findAll() {
    return this.prisma.goodsReceivedNote.findMany({
      include: {
        items: true,
        supplier: true,
      },
      orderBy: {
        receivedDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const grn = await this.prisma.goodsReceivedNote.findUnique({
      where: { docId: id },
      include: {
        items: true,
        supplier: true, 
      },
    });

    if (!grn) {
      throw new NotFoundException(`Goods Received Note with ID ${id} not found`);
    }

    return grn;
  }

  async update(
    id: string,
    data: {
      poId?: string | null;
      supplierId?: string;
      siteLocationId?: string | null;
      receivedBy?: string | null;
      inspectedBy?: string | null;
      deliveryNote?: string | null;
      notes?: string | null;
      receivedDate?: Date;
    },
  ) {
    await this.findOne(id);

    return this.prisma.goodsReceivedNote.update({
      where: { docId: id },
      data: {
        poId: data.poId === undefined ? undefined : data.poId,
        supplierId: data.supplierId, 
        siteLocationId: data.siteLocationId === undefined ? undefined : data.siteLocationId,
        receivedBy: data.receivedBy === undefined ? undefined : data.receivedBy,
        inspectedBy: data.inspectedBy === undefined ? undefined : data.inspectedBy,
        deliveryNote: data.deliveryNote === undefined ? undefined : data.deliveryNote,
        notes: data.notes === undefined ? undefined : data.notes,
        receivedDate: data.receivedDate,
      },
      include: {
        items: true,
        supplier: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.goodsReceivedNoteItem.deleteMany({
      where: { grnId: id },
    });

    return this.prisma.goodsReceivedNote.delete({
      where: { docId: id },
    });
  }
}
