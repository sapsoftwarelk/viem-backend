import { Injectable } from '@nestjs/common';
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
  create(data: {
    id: string;

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
    return this.prisma.vehicle.create({
      data,
    });
  }

  // UPDATE VEHICLE
  update(
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
    return this.prisma.vehicle.update({
      where: { id },
      data,
    });
  }

  // DELETE VEHICLE
  remove(id: string) {
    return this.prisma.vehicle.delete({
      where: { id },
    });
  }
}