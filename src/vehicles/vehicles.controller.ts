import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';

import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  // GET ALL VEHICLES
  @Get()
  findAll() {
    return this.vehiclesService.findAll();
  }

  // GET SINGLE VEHICLE
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  // CREATE VEHICLE
  @Post()
  create(
    @Body()
    body: {
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
    },
  ) {
    return this.vehiclesService.create(body);
  }

  // UPDATE VEHICLE
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
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
    return this.vehiclesService.update(id, body);
  }

  // DELETE VEHICLE
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}
