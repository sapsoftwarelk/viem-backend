import { Injectable } from '@nestjs/common';

@Injectable()
export class FrontendFallbacksService {
  private readonly stores = new Map<string, any[]>();

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
      this.stores.set(resource, []);
    }
    return this.stores.get(resource)!;
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
