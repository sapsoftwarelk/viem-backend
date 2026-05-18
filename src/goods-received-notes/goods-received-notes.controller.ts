import { Body, Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { GoodsReceivedNotesService } from './goods-received-notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { CreateGRNDto } from './goods-received-notes.service';

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

  @Post('expire-batches')
  async expireBatches() {
    return this.grnService.expireConsumableBatches();
  }
}
