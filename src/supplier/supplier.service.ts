import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type CreateSupplierDto = {
  name: string;
  code?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  status?: string;
};

export type UpdateSupplierDto = Partial<CreateSupplierDto>;

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSupplierDto) {
    if (!data.name?.trim()) {
      throw new BadRequestException('name is required');
    }

    const id = await this.generateSupplierId();

    return this.prisma.supplier.create({
      data: {
        id,
        code: data.code || id,
        name: data.name.trim(),
        contactPerson: data.contactPerson || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        taxId: data.taxId || '',
        status: data.status || 'Active',
      },
    });
  }

  findAll() {
    return this.prisma.supplier.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async update(id: string, data: UpdateSupplierDto) {
    await this.findOne(id);

    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        address: data.address,
        taxId: data.taxId,
        status: data.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.supplier.delete({
      where: { id },
    });
  }

  private async generateSupplierId(): Promise<string> {
    const count = await this.prisma.supplier.count();
    return `SUP-${String(count + 1).padStart(3, '0')}`;
  }
}