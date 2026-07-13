import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 

const pad = (n: number, width = 4) => String(n).padStart(width, '0');

type ItemInput = { itemId?: string; itemName: string; quantity: number };

export type RepairNoteInput = {
  locationId?: string;
  siteId?: string;
  vendor: string;
  repairStatus?: string;
  expectedReturnDate?: string;
  remarks?: string;
  items: ItemInput[];
};

const includeItems = { items: true };

@Injectable()
export class RepairNotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.repairNote.findMany({
      include: includeItems,
      orderBy: { createdDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const note = await this.prisma.repairNote.findUnique({
      where: { id },
      include: includeItems,
    });
    if (!note) throw new NotFoundException(`Repair note ${id} not found`);
    return note;
  }

  async create(data: RepairNoteInput) {
    const count = await this.prisma.repairNote.count();
    const id = `RPN-${pad(count + 1)}`;

    return this.prisma.repairNote.create({
      data: {
        id,
        locationId: data.locationId || null,
        siteId: data.siteId || null,
        vendor: data.vendor,
        repairStatus: data.repairStatus || 'Pending',
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
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

  async update(id: string, data: Partial<RepairNoteInput>) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.repairNoteItem.deleteMany({ where: { repairNoteId: id } });
      }

      return tx.repairNote.update({
        where: { id },
        data: {
          ...(data.locationId !== undefined && { locationId: data.locationId || null }),
          ...(data.siteId !== undefined && { siteId: data.siteId || null }),
          ...(data.vendor !== undefined && { vendor: data.vendor }),
          ...(data.repairStatus !== undefined && { repairStatus: data.repairStatus }),
          ...(data.expectedReturnDate !== undefined && {
            expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
          }),
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
    await this.prisma.repairNote.delete({ where: { id } });
    return { deleted: true };
  }
}