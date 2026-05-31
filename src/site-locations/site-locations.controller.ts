import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { SiteLocationsService } from './site-locations.service';
import type { CreateSiteLocationDto, UpdateSiteLocationDto } from './site-locations.service';

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
}
