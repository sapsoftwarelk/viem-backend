import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  // GET ALL VEHICLES
  findAll() {
    return this.prisma.vehicle.findMany({
      include: {
        trips: true,
      },
    });
  }

  // GET SINGLE VEHICLE
  findOne(id: string) {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: true,
      },
    });
  }

  // CREATE VEHICLE
  async create(data: {
    id?: string;

    registrationNo: string;
    category: string;

    make: string;
    model: string;

    year: number;
    color: string;

    fuelType: string;

    status?: string;

    notes?: string;

    insuranceExpiry: Date;
    registrationExpiry: Date;
  }) {
    const subCategoryId = await this.resolveSubCategoryId(data.category);
    const id = data.id || await this.generateVehicleId(data.category);
    return this.prisma.vehicle.create({
      data: {
        id,
        registrationNo: data.registrationNo,
        category: data.category,
        subCategory: { connect: { id: subCategoryId } },
        make: data.make,
        model: data.model,
        year: data.year,
        color: data.color,
        fuelType: data.fuelType,
        status: data.status,
        notes: data.notes,
        insuranceExpiry: this.parseDate(data.insuranceExpiry, 'insuranceExpiry'),
        registrationExpiry: this.parseDate(data.registrationExpiry, 'registrationExpiry'),
      },
    });
  }

  // UPDATE VEHICLE
  async update(
    id: string,
    data: {
      registrationNo?: string;
      category?: string;

      make?: string;
      model?: string;

      year?: number;
      color?: string;

      fuelType?: string;

      status?: string;

      notes?: string;

      insuranceExpiry?: Date;
      registrationExpiry?: Date;
    },
  ) {
    const updateData: any = {
      registrationNo: data.registrationNo,
      make: data.make,
      model: data.model,
      year: data.year,
      color: data.color,
      fuelType: data.fuelType,
      status: data.status,
      notes: data.notes,
      insuranceExpiry: data.insuranceExpiry ? this.parseDate(data.insuranceExpiry, 'insuranceExpiry') : undefined,
      registrationExpiry: data.registrationExpiry ? this.parseDate(data.registrationExpiry, 'registrationExpiry') : undefined,
    };

    if (data.category) {
      const subCategoryId = await this.resolveSubCategoryId(data.category);
      updateData.subCategory = { connect: { id: subCategoryId } };
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: updateData,
    });
  }

  // DELETE VEHICLE
  remove(id: string) {
    return this.prisma.vehicle.delete({
      where: { id },
    });
  }

  private async resolveSubCategoryId(category?: string): Promise<number> {
    if (!category) {
      throw new BadRequestException('Vehicle category is required');
    }
    const normalized = this.categoryCode(category);
    const subCategory = await this.prisma.subCategory.findFirst({ where: { code: normalized } });
    if (subCategory) {
      return subCategory.id;
    }

    const vehicleCategory = await this.prisma.category.upsert({
      where: { slug: 'vehicles' },
      update: {},
      create: { name: 'Vehicles', slug: 'vehicles' },
    });

    const created = await this.prisma.subCategory.create({
      data: {
        name: category,
        code: normalized,
        slug: `vehicle-${normalized.toLowerCase()}`,
        categoryId: vehicleCategory.id,
      },
    });
    return created.id;
  }

  private categoryCode(category: string): string {
    return category.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private async generateVehicleId(category: string): Promise<string> {
    const code = this.categoryCode(category);
    const count = await this.prisma.vehicle.count({ where: { category } });
    const sequence = (count + 1).toString().padStart(4, '0');
    return `VEH-${code}-${sequence}`;
  }

  private parseDate(value: Date | string | undefined, field: string): Date {
    if (!value) {
      throw new BadRequestException(`${field} is required`);
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid date`);
    }
    return date;
  }
}
