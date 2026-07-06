import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoodsReceivedNotesService {
  constructor(private prisma: PrismaService) {}

  // 1. Goods Received Note (GRN) එකක් නිර්මාණය කිරීම
  async create(data: {
    docId: string;
    poId?: string | null;
    supplierId: string; // 👈 පැරණි 'supplier' වෙනුවට නව 'supplierId' අනිවාර්ය කර ඇත
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
  }) {
    // Transaction එකක් භාවිතයෙන් GRN එක සහ එහි අයිතම (Items) එකවර සුරැකීම
    return this.prisma.$transaction(async (tx) => {
      const grn = await tx.goodsReceivedNote.create({
        data: {
          docId: data.docId,
          poId: data.poId || null,
          supplierId: data.supplierId, // 👈 Relation එක නිවැරදිව Map කිරීම
          siteLocationId: data.siteLocationId || null,
          receivedBy: data.receivedBy || null,
          inspectedBy: data.inspectedBy || null,
          deliveryNote: data.deliveryNote || null,
          notes: data.notes || null,
          receivedDate: data.receivedDate || new Date(),
        },
      });

      // GRN එකට අදාළ බිල්පත් අයිතම (Items) සියල්ල නිර්මාණය කිරීම
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
        include: { items: true, supplier: true }, // Supplier විස්තර ද සමඟින් ලබා දීම
      });
    });
  }

  // 2. සියලුම GRN වාර්තා ලබා ගැනීම
  async findAll() {
    return this.prisma.goodsReceivedNote.findMany({
      include: {
        items: true,
        supplier: true, // 👈 Supplier සම්බන්ධතාවය Fetch කිරීම
      },
      orderBy: {
        receivedDate: 'desc',
      },
    });
  }

  // 3. නිශ්චිත ID එකක් අනුව එක් GRN වාර්තාවක් ලබා ගැනීම
  async findOne(id: string) {
    const grn = await this.prisma.goodsReceivedNote.findUnique({
      where: { docId: id },
      include: {
        items: true,
        supplier: true, // 👈 Supplier සම්බන්ධතාවය Fetch කිරීම
      },
    });

    if (!grn) {
      throw new NotFoundException(`Goods Received Note with ID ${id} not found`);
    }

    return grn;
  }

  // 4. GRN වාර්තාවක් යාවත්කාලීන කිරීම (Update)
  async update(
    id: string,
    data: {
      poId?: string | null;
      supplierId?: string; // 👈 Optional කර ඇත
      siteLocationId?: string | null;
      receivedBy?: string | null;
      inspectedBy?: string | null;
      deliveryNote?: string | null;
      notes?: string | null;
      receivedDate?: Date;
    },
  ) {
    // පවතින GRN එක පරීක්ෂා කිරීම
    await this.findOne(id);

    return this.prisma.goodsReceivedNote.update({
      where: { docId: id },
      data: {
        poId: data.poId === undefined ? undefined : data.poId,
        supplierId: data.supplierId, // 👈 'supplier' වෙනුවට 'supplierId' යාවත්කාලීන කිරීම
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

  // 5. GRN වාර්තාවක් පද්ධතියෙන් ඉවත් කිරීම (Delete)
  async remove(id: string) {
    await this.findOne(id);

    // Cascade Delete සක්‍රීය කර නොමැති නම් ප්‍රථමයෙන් Items මැකිය යුතුය
    await this.prisma.goodsReceivedNoteItem.deleteMany({
      where: { grnId: id },
    });

    return this.prisma.goodsReceivedNote.delete({
      where: { docId: id },
    });
  }
}