import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { UpdateToolStatusDto, LogMachineHoursDto, RecordMovementDto } from './tools.service';

@Controller('tools')
@UseGuards(JwtAuthGuard)
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
