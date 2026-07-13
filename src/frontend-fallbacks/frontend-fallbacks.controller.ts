import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { FrontendFallbacksService } from './frontend-fallbacks.service';

// transfer-notes, return-notes, and repair-notes were moved to real,
// Prisma-backed modules (TransferNotesModule / ReturnNotesModule /
// RepairNotesModule) — see those folders. This controller now only serves
// damage-reports, which still needs a real backend module + Prisma model
// once that frontend page is available.
@Controller()
export class FrontendFallbacksController {
  constructor(private readonly service: FrontendFallbacksService) {}

  @Get('damage-reports')
  getDamageReports() {
    return this.service.findAll('damage-reports');
  }

  @Get('damage-reports/:id')
  getDamageReport(@Param('id') id: string) {
    return this.service.findOne('damage-reports', id);
  }

  @Post('damage-reports')
  createDamageReport(@Body() body: Record<string, any>) {
    return this.service.create('damage-reports', body);
  }

  @Put('damage-reports/:id')
  updateDamageReport(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.service.update('damage-reports', id, body);
  }

  @Delete('damage-reports/:id')
  deleteDamageReport(@Param('id') id: string) {
    return this.service.remove('damage-reports', id);
  }
}