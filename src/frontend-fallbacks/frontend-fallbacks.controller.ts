import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { FrontendFallbacksService } from './frontend-fallbacks.service';

@Controller()
export class FrontendFallbacksController {
  constructor(private readonly service: FrontendFallbacksService) {}

  @Get('transfer-notes')
  getTransferNotes() {
    return this.service.findAll('transfer-notes');
  }

  @Get('transfer-notes/:id')
  getTransferNote(@Param('id') id: string) {
    return this.service.findOne('transfer-notes', id);
  }

  @Post('transfer-notes')
  createTransferNote(@Body() body: Record<string, any>) {
    return this.service.create('transfer-notes', body);
  }

  @Put('transfer-notes/:id')
  updateTransferNote(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.service.update('transfer-notes', id, body);
  }

  @Delete('transfer-notes/:id')
  deleteTransferNote(@Param('id') id: string) {
    return this.service.remove('transfer-notes', id);
  }

  @Get('return-notes')
  getReturnNotes() {
    return this.service.findAll('return-notes');
  }

  @Get('return-notes/:id')
  getReturnNote(@Param('id') id: string) {
    return this.service.findOne('return-notes', id);
  }

  @Post('return-notes')
  createReturnNote(@Body() body: Record<string, any>) {
    return this.service.create('return-notes', body);
  }

  @Put('return-notes/:id')
  updateReturnNote(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.service.update('return-notes', id, body);
  }

  @Delete('return-notes/:id')
  deleteReturnNote(@Param('id') id: string) {
    return this.service.remove('return-notes', id);
  }

  @Get('repair-notes')
  getRepairNotes() {
    return this.service.findAll('repair-notes');
  }

  @Get('repair-notes/:id')
  getRepairNote(@Param('id') id: string) {
    return this.service.findOne('repair-notes', id);
  }

  @Post('repair-notes')
  createRepairNote(@Body() body: Record<string, any>) {
    return this.service.create('repair-notes', body);
  }

  @Put('repair-notes/:id')
  updateRepairNote(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.service.update('repair-notes', id, body);
  }

  @Delete('repair-notes/:id')
  deleteRepairNote(@Param('id') id: string) {
    return this.service.remove('repair-notes', id);
  }

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
