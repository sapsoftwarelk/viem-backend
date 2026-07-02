import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. නව Purchase Order එකක් නිර්මාණය කිරීම
   */
  async createPurchaseOrder(dto: any, creatorId: string) {
    const poId = dto.docId;

    return await this.prisma.document.create({
      data: {
        id: poId,
        type: 'PO', // DocType Enum
        status: 'PENDING',
        isAdminApproved: false,
        creatorId: creatorId, // Links to User
        poDetails: {
          create: {
            supplier: dto.supplier,
            totalCost: dto.totalCost,
            expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : new Date(),
          },
        },
      },
      include: {
        poDetails: true,
      },
    });
  }

  /**
   * 2. සියලුම Purchase Orders ලබා ගැනීම (findAll)
   * Document වගුවෙන් PO වර්ගයේ සියලුම වාර්තා සහ ඒවායේ poDetails ලබා ගනී.
   */
  async findAll() {
    return await this.prisma.document.findMany({
      where: {
        type: 'PO', // DocType Enum[cite: 3]
      },
      include: {
        poDetails: true,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 3. අනුමැතිය අපේක්ෂිත (Pending) Purchase Orders පමණක් ලබා ගැනීම (findPendingApproval)
   */
  async findPendingApproval() {
    return await this.prisma.document.findMany({
      where: {
        type: 'PO',
        status: 'PENDING',
      },
      include: {
        poDetails: true,
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // පැරණි ඒවා මුලින්ම පෙන්වීමට
      },
    });
  }

  /**
   * 4. ID එකක් මඟින් නිශ්චිත Purchase Order එකක් සොයා ගැනීම (findOne)
   */
  async findOne(id: string) {
    const po = await this.prisma.document.findUnique({
      where: { id },
      include: {
        poDetails: true,
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        grnDetails: true, // සබඳතා පරීක්ෂාව සඳහා[cite: 3]
      },
    });

    if (!po || po.type !== 'PO') {
      throw new NotFoundException(`Purchase Order with ID ${id} not found.`);
    }

    return po;
  }

  /**
   * 5. Purchase Order එකක් ප්‍රතික්ෂේප කිරීම
   */
  async rejectPurchaseOrder(poId: string) {
    await this.findOne(poId); // පවතින්නේදැයි තහවුරු කරගැනීම

    return await this.prisma.document.update({
      where: { id: poId },
      data: {
        status: 'REJECTED',
        isAdminApproved: false,
      },
      include: {
        poDetails: true,
      },
    });
  }

  /**
   * 6. Purchase Order එකක් අනුමත කිරීම
   */
  async approvePurchaseOrder(poId: string) {
    await this.findOne(poId); // පවතින්නේදැයි තහවුරු කරගැනීම

    return await this.prisma.document.update({
      where: { id: poId },
      data: {
        status: 'APPROVED',
        isAdminApproved: true,
      },
      include: {
        poDetails: true,
      },
    });
  }
}