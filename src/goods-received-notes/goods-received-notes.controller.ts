import { Body, Controller, Get, Param, Patch, Post, Delete, UseGuards, Request } from '@nestjs/common';
import { GoodsReceivedNotesService } from './goods-received-notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('goods-received-notes')
@UseGuards(JwtAuthGuard)
export class GoodsReceivedNotesController {
  constructor(private readonly grnService: GoodsReceivedNotesService) {}

  @Post()
  async create(
    @Request() req,
    @Body()
    createData: {
      docId: string;
      poId?: string | null;
      supplierId: string; 
      siteLocationId?: string | null;
      receivedBy?: string | null;
      inspectedBy?: string | null;
      deliveryNote?: string | null;
      notes?: string | null;
      receivedDate?: Date;
      items: {
        poLineId?: string | null;
        itemId?: string | null;
        itemName: string;
        type?: string | null;
        categoryCode?: string | null;
        unit?: string | null;
        qtyOrdered?: number | null;
        qtyReceived: number;
        unitPrice?: number | null;
        isRegistered?: boolean;
        condition?: string | null;
      }[];
    },
  ) {
   
    return this.grnService.create(createData);
  }

  @Get()
  async findAll() {
    return this.grnService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.grnService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    updateData: {
      poId?: string | null;
      supplierId?: string;
      siteLocationId?: string | null;
      receivedBy?: string | null;
      inspectedBy?: string | null;
      deliveryNote?: string | null;
      notes?: string | null;
      receivedDate?: Date;
    },
  ) {
    return this.grnService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.grnService.remove(id);
  }
}