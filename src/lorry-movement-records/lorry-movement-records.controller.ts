import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import type { CreateLMRDto, UpdateLMRStatusDto, UpdateLMRReturnDto } from './lorry-movement-records.service';
import { LorryMovementRecordsService } from './lorry-movement-records.service';

@Controller('lmrs')
export class LorryMovementRecordsController {
  constructor(private readonly lmrService: LorryMovementRecordsService) {}

  @Post()
  async create(@Body() dto: CreateLMRDto) {
    const driverId = 'temp-driver-id';
    return this.lmrService.createLMR(driverId, dto);
  }

  @Get()
  async findAll() {
    return this.lmrService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.lmrService.findOne(id);
  }

  @Patch(':id/start')
  async start(@Param('id') id: string) {
    return this.lmrService.startTrip(id);
  }

  @Patch(':id/deliver')
  async deliver(@Param('id') id: string) {
    return this.lmrService.markDelivered(id);
  }

  @Patch(':id/return')
  async return(@Param('id') id: string, @Body() dto: UpdateLMRReturnDto) {
    return this.lmrService.markReturned(id, dto);
  }

  @Patch(':id/close')
  async close(@Param('id') id: string) {
    return this.lmrService.closeTrip(id);
  }
}
