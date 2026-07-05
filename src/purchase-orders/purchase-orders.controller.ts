import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Using `any` for now to match the existing service signature.
// Replace with a real CreatePurchaseOrderDto once you want request validation.
type CreatePODto = any;

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard) // JWT auth enforced on all routes
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Post()
  async create(@Body() createPODto: CreatePODto, @Request() req) {
    const userId = req.user.id;
    return this.poService.createPurchaseOrder(createPODto, userId);
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
  async approve(@Param('id') id: string, @Request() req) {
    return this.poService.approvePurchaseOrder(id);
  }

  @Patch(':id/reject')
  async reject(@Param('id') id: string) {
    return this.poService.rejectPurchaseOrder(id);
  }
}