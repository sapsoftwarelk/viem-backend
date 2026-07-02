import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// සටහන: ඔබේ සේවා ගොනුව තුළ පවතින සැබෑ DTO නම් සමඟ මේවා ගළපා ගන්න.
// මීට පෙර සේවා ස්තරයේ දී 'dto: any' ලෙස භාවිතා කළ බැවින්, මෙහිදී TypeScript errors මඟහරවා ගැනීමට Type aliases භාවිතා කර ඇත.
type CreatePODto = any; 

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard) // සියලුම Routes සඳහා JWT ආරක්ෂණය සක්‍රීයයි
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
    const adminUserId = req.user.id; 
    return this.poService.approvePurchaseOrder(id);
  }

 
  @Patch(':id/reject')
  async reject(@Param('id') id: string) {
    return this.poService.rejectPurchaseOrder(id);
  }
}