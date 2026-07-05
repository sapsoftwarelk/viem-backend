import { Body, Controller, Get, Param, Patch, Post, Delete, UseGuards, Request } from '@nestjs/common';
import { GoodsReceivedNotesService } from './goods-received-notes.service';
import type { CreateGRNDto, UpdateGRNDto } from './goods-received-notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('goods-received-notes')
@UseGuards(JwtAuthGuard)
export class GoodsReceivedNotesController {
  constructor(private readonly grnService: GoodsReceivedNotesService) {}

  @Post()
  async create(@Body() createGRNDto: CreateGRNDto, @Request() req) {
    const userId = req.user.id;
    return this.grnService.createGRN(userId, createGRNDto);
  }

  @Get()
  async findAll() {
    return this.grnService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.grnService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateGRNDto: UpdateGRNDto) {
    return this.grnService.updateGRN(id, updateGRNDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.grnService.deleteGRN(id);
  }

  @Post('expire-batches')
  async expireBatches() {
    return this.grnService.expireConsumableBatches();
  }
}