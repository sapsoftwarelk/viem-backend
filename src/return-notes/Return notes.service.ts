import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 

const pad = (n: number, width = 4) => String(n).padStart(width, '0');

type ItemInput = { itemId?: string; itemName: string; quantity: number };

export type ReturnNoteInput = {
  fromLocationId?: string;
  fromSiteId?: string;
  toLocationId?: string;
  toSiteId?: string;
  returnDate?: string;
  remarks?: string;
  items: ItemInput[];
};

const includeItems = { items: true };

@Injectable()
export class ReturnNotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.returnNote.findMany({
      include: includeItems,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const note = await this.prisma.returnNote.findUnique({
      where: { id },
      include: includeItems,
    });
    if (!note) throw new NotFoundException(`Return note ${id} not found`);
    return note;
  }

  async create(data: ReturnNoteInput) {
    const count = await this.prisma.returnNote.count();
    const id = `RTN-${pad(count + 1)}`;

    return this.prisma.returnNote.create({
      data: {
        id,
        fromLocationId: data.fromLocationId || null,
        fromSiteId: data.fromSiteId || null,
        toLocationId: data.toLocationId || null,
        toSiteId: data.toSiteId || null,
        returnDate: data.returnDate ? new Date(data.returnDate) : new Date(),
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

  async update(id: string, data: Partial<ReturnNoteInput>) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.returnNoteItem.deleteMany({ where: { returnNoteId: id } });
      }

      return tx.returnNote.update({
        where: { id },
        data: {
          ...(data.fromLocationId !== undefined && { fromLocationId: data.fromLocationId || null }),
          ...(data.fromSiteId !== undefined && { fromSiteId: data.fromSiteId || null }),
          ...(data.toLocationId !== undefined && { toLocationId: data.toLocationId || null }),
          ...(data.toSiteId !== undefined && { toSiteId: data.toSiteId || null }),
          ...(data.returnDate !== undefined && { returnDate: new Date(data.returnDate) }),
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
    await this.findOne(id);
    await this.prisma.returnNote.delete({ where: { id } });
    return { deleted: true };
  }
}