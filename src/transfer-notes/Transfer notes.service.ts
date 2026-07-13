import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 

const pad = (n: number, width = 4) => String(n).padStart(width, '0');

type ItemInput = { itemId?: string; itemName: string; quantity: number };

export type TransferNoteInput = {
  fromLocationId?: string;
  fromSiteId?: string;
  toLocationId?: string;
  toSiteId?: string;
  transferDate?: string;
  remarks?: string;
  items: ItemInput[];
};

const includeItems = { items: true };

@Injectable()
export class TransferNotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.transferNote.findMany({
      include: includeItems,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const note = await this.prisma.transferNote.findUnique({
      where: { id },
      include: includeItems,
    });
    if (!note) throw new NotFoundException(`Transfer note ${id} not found`);
    return note;
  }

  async create(data: TransferNoteInput) {
    const count = await this.prisma.transferNote.count();
    const id = `TRN-${pad(count + 1)}`;

    return this.prisma.transferNote.create({
      data: {
        id,
        fromLocationId: data.fromLocationId || null,
        fromSiteId: data.fromSiteId || null,
        toLocationId: data.toLocationId || null,
        toSiteId: data.toSiteId || null,
        transferDate: data.transferDate ? new Date(data.transferDate) : new Date(),
        remarks: data.remarks || null,
        items: {
          create: (data.items || []).map((item) => ({
            itemId: item.itemId || null,
            itemName: item.itemName,
            quantity: item.quantity,
          })),
        },
      },
      include: includeItems,
    });
  }

  async update(id: string, data: Partial<TransferNoteInput>) {
    await this.findOne(id); // 404s if missing

    // Items are replaced wholesale on edit — simplest correct behavior for a
    // small item list edited via the form modal (matches frontend UX, which
    // always submits the full items array, not a diff).
    return this.prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.transferNoteItem.deleteMany({ where: { transferNoteId: id } });
      }

      return tx.transferNote.update({
        where: { id },
        data: {
          ...(data.fromLocationId !== undefined && { fromLocationId: data.fromLocationId || null }),
          ...(data.fromSiteId !== undefined && { fromSiteId: data.fromSiteId || null }),
          ...(data.toLocationId !== undefined && { toLocationId: data.toLocationId || null }),
          ...(data.toSiteId !== undefined && { toSiteId: data.toSiteId || null }),
          ...(data.transferDate !== undefined && { transferDate: new Date(data.transferDate) }),
          ...(data.remarks !== undefined && { remarks: data.remarks || null }),
          ...(data.items && {
            items: {
              create: data.items.map((item) => ({
                itemId: item.itemId || null,
                itemName: item.itemName,
                quantity: item.quantity,
              })),
            },
          }),
        },
        include: includeItems,
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id); // 404s if missing
    await this.prisma.transferNote.delete({ where: { id } });
    return { deleted: true };
  }
}