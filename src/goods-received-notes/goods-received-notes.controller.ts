import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GoodsReceivedNotesService } from './goods-received-notes.service';
import type { CreateGRNDto } from './goods-received-notes.service';

@Controller('goods-received-notes')
export class GoodsReceivedNotesController {
  constructor(private readonly grnService: GoodsReceivedNotesService) {}

  @Post()
  async create(@Body() createGRNDto: CreateGRNDto) {
    // TODO: Get userId from authentication context
    const userId = 'temp-user-id'; // Replace with actual user from auth
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
}
