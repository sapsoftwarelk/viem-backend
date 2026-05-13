import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import type { CreateGINDto } from './goods-issue-notes.service';
import { GoodsIssueNotesService } from './goods-issue-notes.service';

@Controller('goods-issue-notes')
export class GoodsIssueNotesController {
  constructor(private readonly ginService: GoodsIssueNotesService) {}

  @Post()
  async create(@Body() createGINDto: CreateGINDto) {
    const userId = 'temp-user-id';
    return this.ginService.createGIN(userId, createGINDto);
  }

  @Get()
  async findAll() {
    return this.ginService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ginService.findOne(id);
  }

  @Patch(':id/ready')
  async ready(@Param('id') id: string) {
    return this.ginService.markReady(id);
  }

  @Patch(':id/load')
  async load(@Param('id') id: string, @Body() body: { vehicleId: string; driverId: string }) {
    return this.ginService.confirmLoading(id, body.vehicleId, body.driverId);
  }

  @Patch(':id/deliver')
  async deliver(@Param('id') id: string) {
    return this.ginService.confirmDelivery(id);
  }

  @Patch(':id/discrepancy')
  async discrepancy(@Param('id') id: string) {
    return this.ginService.reportDiscrepancy(id);
  }

  @Patch(':id/return')
  async initiateReturn(@Param('id') id: string) {
    return this.ginService.initiateReturn(id);
  }

  @Patch(':id/rt-transit')
  async returnTransit(@Param('id') id: string) {
    return this.ginService.startReturnTransit(id);
  }

  @Patch(':id/receive-at-wh')
  async receiveAtWarehouse(@Param('id') id: string) {
    return this.ginService.receiveAtWarehouse(id);
  }

  @Patch(':id/close')
  async close(@Param('id') id: string) {
    return this.ginService.close(id);
  }
}
