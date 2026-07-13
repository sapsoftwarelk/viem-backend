import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { RepairNotesService } from './Repair notes.service';
import type { RepairNoteInput } from './Repair notes.service';

@Controller('repair-notes')
export class RepairNotesController {
  constructor(private readonly service: RepairNotesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: RepairNoteInput) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<RepairNoteInput>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}