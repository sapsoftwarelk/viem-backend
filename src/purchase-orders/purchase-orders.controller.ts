import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import type { CreatePODto, ApprovePODto } from './purchase-orders.service';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Post()
  async create(@Body() createPODto: CreatePODto) {
    // TODO: Get userId from authentication context
    const userId = 'temp-user-id'; // Replace with actual user from auth
    return this.poService.createPO(userId, createPODto);
  }

  @Get()
  async findAll() {
    return this.poService.findAll();
  }

  @Get('pending')
  async findPendingApproval() {
    return this.poService.findPendingApproval();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.poService.findOne(id);
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string, @Body() approveDto: ApprovePODto) {
    // TODO: Get admin userId from authentication context
    const adminUserId = 'temp-admin-id'; // Replace with actual admin user from auth
    return this.poService.approvePO(id, adminUserId, approveDto);
  }
}
