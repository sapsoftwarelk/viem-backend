import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocType, GINItemType, GINStatus, ToolStatus } from '@prisma/client';
import { toDataURL } from 'qrcode';

export interface CreateGINItemDto {
  itemType: 'TOOL' | 'CONSUMABLE' | 'REUSABLE';
  itemId?: string;
  subCategoryId?: number;
  quantity: number;
  overrideFIFO?: boolean;
  fifoOverrideReason?: string;
}

export interface CreateGINDto {
  items: CreateGINItemDto[];
  isSiteDirect?: boolean;
  siteLocationId?: string;
}

@Injectable()
export class GoodsIssueNotesService {
  constructor(private prisma: PrismaService) {}

  async createGIN(userId: string, dto: CreateGINDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('GIN must include at least one item');
    }

    const ginId = await this.generateGINId();
    await this.prisma.document.create({
      data: {
        id: ginId,
        type: DocType.GIN,
        creatorId: userId,
        status: 'DRAFT',
        isAdminApproved: false,
      },
    });

    const gin = await this.prisma.goodsIssueNote.create({
      data: {
        docId: ginId,
        isSiteDirect: dto.isSiteDirect || false,
        siteLocationId: dto.siteLocationId,
      },
    });

    const items = [] as any[];

    for (const item of dto.items) {
      if (item.quantity <= 0) {
        throw new BadRequestException(
          'Item quantity must be greater than zero',
        );
      }

      if (item.itemType === 'TOOL') {
        const tool = await this.prisma.tool.findUnique({
          where: { id: item.itemId },
        });
        if (!tool) throw new NotFoundException('Tool not found');
        const availableForDispatch = [
          ToolStatus.IN_WAREHOUSE,
          ToolStatus.READY,
        ];
        if (!availableForDispatch.includes(tool.status as any)) {
          throw new BadRequestException('Tool is not available for dispatch');
        }
        items.push(
          await this.prisma.goodsIssueNoteItem.create({
            data: {
              ginId,
              itemType: GINItemType.TOOL,
              toolId: item.itemId,
              quantity: item.quantity,
            },
          }),
        );
      } else if (item.itemType === 'REUSABLE') {
        const reusable = await this.prisma.reusableItem.findUnique({
          where: { id: item.itemId },
        });
        if (!reusable) throw new NotFoundException('Reusable item not found');
        items.push(
          await this.prisma.goodsIssueNoteItem.create({
            data: {
              ginId,
              itemType: GINItemType.REUSABLE,
              reusableId: item.itemId,
              quantity: item.quantity,
            },
          }),
        );
      } else if (item.itemType === 'CONSUMABLE') {
        if (!item.itemId && !item.subCategoryId) {
          throw new BadRequestException(
            'Consumable items need itemId or subCategoryId for FIFO selection',
          );
        }

        if (item.overrideFIFO && !item.fifoOverrideReason) {
          throw new BadRequestException('FIFO override requires a reason');
        }

        if (item.itemId) {
          const batch = await this.prisma.consumableBatch.findUnique({
            where: { id: item.itemId },
          });
          if (!batch || batch.status !== 'AVAILABLE') {
            throw new NotFoundException('Consumable batch not available');
          }
          if (batch.quantity < item.quantity) {
            throw new BadRequestException(
              'Insufficient quantity in selected batch',
            );
          }
          const updatedBatch = await this.prisma.consumableBatch.update({
            where: { id: item.itemId },
            data: {
              quantity: { decrement: item.quantity },
              status:
                batch.quantity - item.quantity <= 0 ? 'DEPLETED' : batch.status,
            },
          });
          items.push(
            await this.prisma.goodsIssueNoteItem.create({
              data: {
                ginId,
                itemType: GINItemType.CONSUMABLE,
                consumableId: batch.id,
                quantity: item.quantity,
                fifoOverride: item.overrideFIFO || false,
                fifoOverrideReason: item.fifoOverrideReason,
                fifoOverrideApprovedBy: item.overrideFIFO ? userId : null,
                fifoOverrideApprovedAt: item.overrideFIFO ? new Date() : null,
              },
            }),
          );
        } else {
          const selections = await this.selectConsumableBatches(
            item.subCategoryId!,
            item.quantity,
          );
          for (const selection of selections) {
            const updatedBatch = await this.prisma.consumableBatch.update({
              where: { id: selection.batch.id },
              data: {
                quantity: { decrement: selection.quantity },
                status:
                  selection.batch.quantity - selection.quantity <= 0
                    ? 'DEPLETED'
                    : selection.batch.status,
              },
            });
            items.push(
              await this.prisma.goodsIssueNoteItem.create({
                data: {
                  ginId,
                  itemType: GINItemType.CONSUMABLE,
                  consumableId: selection.batch.id,
                  quantity: selection.quantity,
                },
              }),
            );
          }
        }
      }
    }

    return { gin, items };
  }

  async findAll() {
    return this.prisma.goodsIssueNote.findMany({
      include: {
        document: true,
        items: true,
        lmr: true,
        siteLocation: true,
      },
      orderBy: {
        document: {
          createdAt: 'desc',
        },
      },
    });
  }

  async findOne(id: string) {
    const gin = await this.prisma.goodsIssueNote.findUnique({
      where: { docId: id },
      include: {
        document: true,
        items: true,
        lmr: true,
        siteLocation: true,
      },
    });
    if (!gin) {
      throw new NotFoundException('GIN not found');
    }
    return gin;
  }

  async markReady(id: string) {
    const gin = await this.findOne(id);
    if (gin.status !== GINStatus.DRAFT) {
      throw new BadRequestException(
        'GIN can only be moved to READY from DRAFT',
      );
    }

    const qrPayload = JSON.stringify({
      type: 'GIN',
      id,
      timestamp: new Date().toISOString(),
    });
    const qrCodeDataUrl = await toDataURL(qrPayload);

    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.READY,
        readyAt: new Date(),
        qrCodeDataUrl,
        qrPayload,
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'READY' },
    });
    await this.updateToolStatusesForGINItems(id, ToolStatus.READY);
    return result;
  }

  async confirmLoading(id: string, vehicleId: string, driverId: string) {
    const gin = await this.findOne(id);
    if (gin.status !== GINStatus.READY) {
      throw new BadRequestException('GIN must be READY before loading');
    }

    const lmrId = await this.generateLMRId();
    await this.prisma.document.create({
      data: {
        id: lmrId,
        type: DocType.LMR,
        creatorId: driverId,
        status: 'IN_TRANSIT',
        isAdminApproved: false,
      },
    });

    await this.prisma.lorryMovementRecord.create({
      data: {
        id: lmrId,
        vehicleId,
        driverId,
        departureTime: new Date(),
      },
    });

    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.IN_TRANSIT,
        inTransitAt: new Date(),
        lmrId,
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'IN_TRANSIT' },
    });
    await this.updateToolStatusesForGINItems(id, ToolStatus.IN_TRANSIT);
    return result;
  }

  async scanGINItem(ginId: string, itemId: string, scanQty = 1) {
    const gin = await this.findOne(ginId);
    if (
      gin.status !== GINStatus.IN_TRANSIT &&
      gin.status !== GINStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Items may only be scanned while GIN is in transit or at delivery',
      );
    }

    const item = await this.prisma.goodsIssueNoteItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.ginId !== ginId) {
      throw new NotFoundException('GIN item not found');
    }

    const newScanned = item.scannedCount + scanQty;
    if (newScanned > item.quantity) {
      throw new BadRequestException('Scan count exceeds expected quantity');
    }

    return this.prisma.goodsIssueNoteItem.update({
      where: { id: itemId },
      data: { scannedCount: newScanned },
    });
  }

  async confirmDelivery(id: string) {
    const gin = await this.findOne(id);
    if (gin.status !== GINStatus.IN_TRANSIT) {
      throw new BadRequestException('GIN must be IN_TRANSIT before delivery');
    }

    const items = await this.prisma.goodsIssueNoteItem.findMany({
      where: { ginId: id },
    });
    if (items.length === 0) {
      throw new BadRequestException('GIN has no items to deliver');
    }

    const hasMismatch = items.some(
      (item) => item.scannedCount !== item.quantity,
    );
    const newStatus = hasMismatch ? GINStatus.DISCREPANCY : GINStatus.DELIVERED;
    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: newStatus,
        deliveredAt: new Date(),
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: hasMismatch ? 'DISCREPANCY' : 'DELIVERED' },
    });
    if (!hasMismatch) {
      await this.updateToolStatusesForGINItems(
        id,
        ToolStatus.ON_SITE,
        gin.siteLocationId || undefined,
      );
    }
    return result;
  }

  async reportDiscrepancy(id: string) {
    const gin = await this.findOne(id);
    if (gin.status !== GINStatus.DELIVERED) {
      throw new BadRequestException(
        'Discrepancy can only be reported after delivery',
      );
    }
    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.DISCREPANCY,
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'DISCREPANCY' },
    });
    return result;
  }

  async overrideFIFO(
    ginId: string,
    itemId: string,
    approverId: string,
    reason: string,
  ) {
    if (!reason) {
      throw new BadRequestException('FIFO override reason is required');
    }
    const item = await this.prisma.goodsIssueNoteItem.findUnique({
      where: { id: itemId },
    });
    if (
      !item ||
      item.ginId !== ginId ||
      item.itemType !== GINItemType.CONSUMABLE
    ) {
      throw new NotFoundException('Consumable GIN item not found');
    }
    return this.prisma.goodsIssueNoteItem.update({
      where: { id: itemId },
      data: {
        fifoOverride: true,
        fifoOverrideReason: reason,
        fifoOverrideApprovedBy: approverId,
        fifoOverrideApprovedAt: new Date(),
      },
    });
  }

  async returnConsumable(ginId: string, itemId: string, quantity: number) {
    const gin = await this.findOne(ginId);
    if (
      gin.status !== GINStatus.RETURNING &&
      gin.status !== GINStatus.RTN_TRANSIT
    ) {
      throw new BadRequestException(
        'Consumable returns are only allowed during return workflows',
      );
    }
    const item = await this.prisma.goodsIssueNoteItem.findUnique({
      where: { id: itemId },
    });
    if (
      !item ||
      item.ginId !== ginId ||
      item.itemType !== GINItemType.CONSUMABLE
    ) {
      throw new NotFoundException('Consumable GIN item not found');
    }
    if (quantity <= 0 || quantity > item.quantity) {
      throw new BadRequestException('Invalid return quantity');
    }

    const batch = await this.prisma.consumableBatch.findUnique({
      where: { id: item.consumableId! },
    });
    if (!batch)
      throw new NotFoundException('Original consumable batch not found');

    await this.prisma.consumableBatch.update({
      where: { id: batch.id },
      data: {
        quantity: { increment: quantity },
        status: batch.status === 'DEPLETED' ? 'AVAILABLE' : batch.status,
      },
    });

    return this.prisma.goodsIssueNoteItem.update({
      where: { id: itemId },
      data: {
        returnedQuantity: { increment: quantity },
      },
    });
  }

  async initiateReturn(id: string) {
    const gin = await this.findOne(id);
    if (
      gin.status !== GINStatus.DELIVERED &&
      gin.status !== GINStatus.DISCREPANCY
    ) {
      throw new BadRequestException(
        'Return can only be initiated after delivery or discrepancy',
      );
    }
    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.RETURNING,
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'RETURNING' },
    });
    await this.updateToolStatusesForGINItems(id, ToolStatus.RETURN_INITIATED);
    return result;
  }

  async startReturnTransit(id: string) {
    const gin = await this.findOne(id);
    if (gin.status !== GINStatus.RETURNING) {
      throw new BadRequestException(
        'Return transit can only start after return is initiated',
      );
    }
    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.RTN_TRANSIT,
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'RTN_TRANSIT' },
    });
    await this.updateToolStatusesForGINItems(id, ToolStatus.RETURNING);
    return result;
  }

  async receiveAtWarehouse(id: string) {
    const gin = await this.findOne(id);
    if (gin.status !== GINStatus.RTN_TRANSIT) {
      throw new BadRequestException(
        'Warehouse receive can only happen after return transit',
      );
    }
    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.RECEIVED_AT_WH,
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'RECEIVED_AT_WH' },
    });
    await this.updateToolStatusesForGINItems(id, ToolStatus.RECEIVED_AT_WH);
    return result;
  }

  async close(id: string) {
    const gin = await this.findOne(id);
    if (
      gin.status !== GINStatus.DELIVERED &&
      gin.status !== GINStatus.RECEIVED_AT_WH
    ) {
      throw new BadRequestException(
        'GIN can only be closed after delivery or warehouse receipt',
      );
    }
    const result = await this.prisma.goodsIssueNote.update({
      where: { docId: id },
      data: {
        status: GINStatus.CLOSED,
      },
    });
    await this.prisma.document.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
    if (gin.status === GINStatus.RECEIVED_AT_WH) {
      await this.updateToolStatusesForGINItems(id, ToolStatus.IN_WAREHOUSE);
    }
    return result;
  }

  private async selectConsumableBatches(
    subCategoryId: number,
    quantity: number,
  ) {
    const now = new Date();
    const batches = await this.prisma.consumableBatch.findMany({
      where: {
        subCategoryId,
        status: 'AVAILABLE',
        expiryDate: { gte: now },
        quantity: { gt: 0 },
      },
      orderBy: {
        receivedDate: 'asc',
      },
    });

    let remaining = quantity;
    const selections: Array<{ batch: any; quantity: number }> = [];

    for (const batch of batches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantity, remaining);
      selections.push({ batch, quantity: take });
      remaining -= take;
    }

    if (remaining > 0) {
      throw new BadRequestException(
        'Not enough consumable quantity available to fulfill FIFO selection',
      );
    }

    return selections;
  }

  private async updateToolStatusesForGINItems(
    ginId: string,
    status: ToolStatus,
    locationId?: string,
  ) {
    const toolItems = await this.prisma.goodsIssueNoteItem.findMany({
      where: { ginId, itemType: GINItemType.TOOL },
    });

    for (const item of toolItems) {
      if (!item.toolId) continue;

      const data: { status: ToolStatus; locationId?: string | null } = {
        status,
      };

      if (locationId !== undefined) {
        data.locationId = locationId;
      }

      if (
        status === ToolStatus.IN_TRANSIT ||
        status === ToolStatus.RECEIVED_AT_WH
      ) {
        data.locationId = null;
      }

      await this.prisma.tool.update({
        where: { id: item.toolId },
        data,
      });

      await this.prisma.movementHistory.create({
        data: {
          toolId: item.toolId,
          location: locationId || status,
        },
      });
    }
  }

  private async createSystemUser() {
    const systemId = 'system-user-id';
    const user = await this.prisma.user.findUnique({ where: { id: systemId } });
    if (user) return user;

    const employee = await this.prisma.employee.upsert({
      where: { id: 'EMP-SYS-0001' },
      update: {},
      create: {
        id: 'EMP-SYS-0001',
        name: 'System',
        employeeId: 'SYS0001',
        contact: 'system@veims.local',
        department: 'ADM',
      },
    });

    const role = await this.prisma.role.upsert({
      where: { name: 'System' },
      update: {},
      create: {
        name: 'System',
        canCreateUsers: false,
        canRaisePO: false,
        canConfirmDeliveries: false,
        canRunAudits: false,
        canLogMachineHours: false,
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
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '-');
    return `EXN-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
  }

  private async generateGINId(): Promise<string> {
    const today = new Date();
    const count = await this.prisma.document.count({
      where: {
        type: DocType.GIN,
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
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '-');
    return `GIN-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
  }

  private async generateLMRId(): Promise<string> {
    const today = new Date();
    const count = await this.prisma.document.count({
      where: {
        type: DocType.LMR,
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
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '-');
    return `LMR-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;
  }
}
