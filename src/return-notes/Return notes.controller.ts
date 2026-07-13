import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ReturnNotesService } from './Return notes.service';
import type { ReturnNoteInput } from './Return notes.service';

@Controller('return-notes')
export class ReturnNotesController {
  constructor(private readonly service: ReturnNotesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: ReturnNoteInput) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<ReturnNoteInput>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}