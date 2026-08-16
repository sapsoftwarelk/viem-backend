import { Body, Controller, Delete, Get, Param, Post, Put, Res, Query } from '@nestjs/common';
import { SiteLocationsService } from './site-locations.service';
import type { CreateSiteLocationDto, UpdateSiteLocationDto } from './site-locations.service';
import type { Response } from 'express';

@Controller('site-locations')
export class SiteLocationsController {
  constructor(private readonly siteLocationsService: SiteLocationsService) {}

  @Get()
  findAll() {
    return this.siteLocationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.siteLocationsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSiteLocationDto) {
    return this.siteLocationsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSiteLocationDto) {
    return this.siteLocationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.siteLocationsService.remove(id);
  }

  @Post('assign-people')
  async assignPeopleBulk(
    @Body() body: any,
    @Res() res: Response,
    @Query('download') download?: string,
  ) {
    const assignments = body.assignments || [];
    console.log('[assign-people] incoming assignments:', JSON.stringify(assignments).slice(0, 2000));

    const result = await this.siteLocationsService.assignPeopleBulk(assignments);
    console.log('[assign-people] result:', result && typeof result === 'object' ? { updated: result.updated } : result);

    if (download === 'true') {
      const pdf = await this.siteLocationsService.generatePeoplePdf(assignments);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="site-people-assignments.pdf"');
      res.send(pdf);
      return;
    }

    res.json(result);
  }

  @Post('assign-vehicles')
  async assignVehiclesBulk(
    @Body() body: any,
    @Res() res: Response,
    @Query('download') download?: string,
  ) {
    const assignments = body.assignments || [];
    console.log('[assign-vehicles] incoming assignments:', JSON.stringify(assignments).slice(0, 2000));

    const result = await this.siteLocationsService.assignVehiclesBulk(assignments);
    console.log('[assign-vehicles] result:', result && typeof result === 'object' ? { updated: result.updated } : result);

    if (download === 'true') {
      const pdf = await this.siteLocationsService.generateVehiclesPdf(assignments);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="site-vehicles-assignments.pdf"');
      res.send(pdf);
      return;
    }

    res.json(result);
  }
}