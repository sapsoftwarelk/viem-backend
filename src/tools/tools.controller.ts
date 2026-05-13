import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ToolsService } from './tools.service';
import type { UpdateToolStatusDto, LogMachineHoursDto, RecordMovementDto } from './tools.service';

@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  findAll() {
    return this.toolsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toolsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateToolStatusDto) {
    return this.toolsService.updateStatus(id, dto);
  }

  @Patch(':id/hours')
  logMachineHours(@Param('id') id: string, @Body() dto: LogMachineHoursDto) {
    return this.toolsService.logMachineHours(id, dto);
  }

  @Post(':id/movements')
  recordMovement(@Param('id') id: string, @Body() dto: RecordMovementDto) {
    return this.toolsService.recordMovement(id, dto);
  }
}
