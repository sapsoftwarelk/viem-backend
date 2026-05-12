import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()       findAll()                          { return this.vehiclesService.findAll(); }
  @Get(':id')  findOne(@Param('id') id: string)   { return this.vehiclesService.findOne(id); }
  @Post()      create(@Body() body: any)           { return this.vehiclesService.create(body); }
  @Put(':id')  update(@Param('id') id: string, @Body() body: any) { return this.vehiclesService.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string)  { return this.vehiclesService.remove(id); }
}