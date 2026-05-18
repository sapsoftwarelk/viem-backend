import { Body, Controller, Get, Param, Patch, Post, UseGuards, Request } from '@nestjs/common';
import type { CreateGINDto } from './goods-issue-notes.service';
import { GoodsIssueNotesService } from './goods-issue-notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('goods-issue-notes')
@UseGuards(JwtAuthGuard)
export class GoodsIssueNotesController {
  constructor(private readonly ginService: GoodsIssueNotesService) {}

  @Post()
  async create(@Body() createGINDto: CreateGINDto, @Request() req) {
    const userId = req.user.id;
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

  @Patch(':id/scan')
  async scanItem(
    @Param('id') id: string,
    @Body() body: { itemId: string; scanQty?: number },
  ) {
    return this.ginService.scanGINItem(id, body.itemId, body.scanQty || 1);
  }

  @Patch(':id/deliver')
  async deliver(@Param('id') id: string) {
    return this.ginService.confirmDelivery(id);
  }

  @Patch(':id/discrepancy')
  async discrepancy(@Param('id') id: string) {
    return this.ginService.reportDiscrepancy(id);
  }

  @Patch(':id/override-fifo')
  async overrideFIFO(@Param('id') id: string, @Body() body: { itemId: string; reason: string }) {
    const approverId = 'temp-admin-id';
    return this.ginService.overrideFIFO(id, body.itemId, approverId, body.reason);
  }

  @Patch(':id/return')
  async initiateReturn(@Param('id') id: string) {
    return this.ginService.initiateReturn(id);
  }

  @Patch(':id/items/:itemId/return')
  async returnConsumable(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { quantity: number },
  ) {
    return this.ginService.returnConsumable(id, itemId, body.quantity);
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
