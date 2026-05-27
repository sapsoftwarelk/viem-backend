import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ItemsService } from './items.service';
import type { CreateItemDto } from './items.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  async create(@Body() dto: CreateItemDto) {
    return this.itemsService.create(dto);
  }

  @Get()
  async findAll() {
    return this.itemsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }
}
