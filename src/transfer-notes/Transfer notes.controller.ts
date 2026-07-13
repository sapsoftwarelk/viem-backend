import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { TransferNotesService } from './Transfer notes.service';
import type { TransferNoteInput } from './Transfer notes.service';

@Controller('transfer-notes')
export class TransferNotesController {
  constructor(private readonly service: TransferNotesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: TransferNoteInput) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<TransferNoteInput>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}