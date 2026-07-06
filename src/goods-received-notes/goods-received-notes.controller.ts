import { Body, Controller, Get, Param, Patch, Post, Delete, UseGuards, Request } from '@nestjs/common';
import { GoodsReceivedNotesService } from './goods-received-notes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('goods-received-notes')
@UseGuards(JwtAuthGuard)
export class GoodsReceivedNotesController {
  constructor(private readonly grnService: GoodsReceivedNotesService) {}

  // 1. GRN එකක් නිර්මාණය කිරීම
  @Post()
  async create(
    @Request() req,
    @Body()
    createData: {
      docId: string;
      poId?: string | null;
      supplierId: string; // 👈 නව සබඳතාවයට (Relation) ගැළපෙන පරිදි 'supplierId' ඇතුළත් කර ඇත
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
    // සටහන: ඔබ වහන්සේගේ Service එකෙහි Document එක සාදද්දී Creator/User ID එක අවශ්‍ය නම්, 
    // createData එක සමඟ userId එක ද එකතු කර (e.g., { ...createData, creatorId: req.user.id }) යැවිය හැක.
    return this.grnService.create(createData);
  }

  // 2. සියලුම GRN වාර්තා ලබා ගැනීම
  @Get()
  async findAll() {
    return this.grnService.findAll();
  }

  // 3. නිශ්චිත ID එකක් අනුව එක් GRN වාර්තාවක් ලබා ගැනීම
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.grnService.findOne(id);
  }

  // 4. GRN වාර්තාවක් යාවත්කාලීන කිරීම (Update)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    updateData: {
      poId?: string | null;
      supplierId?: string; // 👈 'supplierId' විකල්ප (Optional) ක්ෂේත්‍රයක් ලෙස
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

  // 5. GRN වාර්තාවක් පද්ධතියෙන් ඉවත් කිරීම (Delete)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.grnService.remove(id);
  }
}