import { Injectable } from '@nestjs/common';

@Injectable()
export class FrontendFallbacksService {
  private readonly stores = new Map<string, any[]>();
  private readonly seeds: Record<string, any[]> = {
    'transfer-notes': [
      {
        id: 'ITN-0001',
        fromLocationId: 'LOC-ADM-0001',
        fromSiteId: 'SITE-ADM-WH1',
        toLocationId: 'LOC-OP-0001',
        toSiteId: 'SITE-OP-COL',
        transferDate: '2025-03-15',
        remarks: 'Transfer for tower construction',
        items: [
          { id: 'item-1', itemName: 'Cement (50kg bags)', quantity: 100 },
          { id: 'item-2', itemName: 'Steel Rebars (12mm)', quantity: 50 },
        ],
      },
    ],
    'return-notes': [
      {
        id: 'SRN-2026-0001',
        returnNumber: 'SRN-2026-0001',
        supplierId: 'sup1',
        supplierName: 'Ceylon Construction Materials',
        returnDate: '2026-05-10',
        status: 'Approved',
        reason: 'Defective cement bags - moisture damage',
        notes: 'Returned 50 bags due to hardening. Supplier acknowledged.',
        totalItems: 50,
        totalValue: 92500,
        createdBy: 'System',
        createdAt: '2026-05-09',
        lines: [
          {
            id: 'l1',
            itemName: 'OPC Cement 50kg',
            quantity: 50,
            unit: 'Bags',
            unitPrice: 1850,
            total: 92500,
            condition: 'Damaged',
            reason: 'Moisture damage',
          },
        ],
      },
    ],
  };

  async findAll(resource: string) {
    return this.getStore(resource);
  }

  async findOne(resource: string, id: string) {
    const store = this.getStore(resource);
    return store.find((item) => item.id === id) || null;
  }

  async create(resource: string, payload: Record<string, any>) {
    const store = this.getStore(resource);
    const record = {
      ...payload,
      id: payload?.id || this.buildId(resource, store.length + 1),
      createdAt: payload?.createdAt || new Date().toISOString(),
    };
    store.push(record);
    return record;
  }

  async update(resource: string, id: string, payload: Record<string, any>) {
    const store = this.getStore(resource);
    const index = store.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }

    const updated = {
      ...store[index],
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    };
    store[index] = updated;
    return updated;
  }

  async remove(resource: string, id: string) {
    const store = this.getStore(resource);
    const index = store.findIndex((item) => item.id === id);
    if (index === -1) {
      return false;
    }

    store.splice(index, 1);
    return true;
  }

  private getStore(resource: string) {
    if (!this.stores.has(resource)) {
      this.stores.set(resource, this.cloneSeed(resource));
    }
    return this.stores.get(resource)!;
  }

  private cloneSeed(resource: string) {
    return (this.seeds[resource] || []).map((item) => ({
      ...item,
      items: Array.isArray(item.items) ? item.items.map((line) => ({ ...line })) : item.items,
      lines: Array.isArray(item.lines) ? item.lines.map((line) => ({ ...line })) : item.lines,
    }));
  }

  private buildId(resource: string, index: number) {
    switch (resource) {
      case 'transfer-notes':
        return `TRN-${String(index).padStart(3, '0')}`;
      case 'return-notes':
        return `RTN-${String(index).padStart(3, '0')}`;
      case 'repair-notes':
        return `RPN-${String(index).padStart(3, '0')}`;
      case 'damage-reports':
        return `DMG-${String(index).padStart(3, '0')}`;
      default:
        return `${resource}-${index}`;
    }
  }
}
