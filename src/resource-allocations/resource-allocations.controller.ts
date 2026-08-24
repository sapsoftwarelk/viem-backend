import { Controller, Get, Put, Body, Param, Query } from '@nestjs/common';
import { ResourceAllocationsService, AllocationInput } from './resource-allocations.service';

@Controller('allocations')
export class ResourceAllocationsController {
  constructor(private readonly service: ResourceAllocationsService) {}

  @Get()
  async listAll() {
    return this.service.findAll();
  }

  @Get('active')
  async active(
    @Query('locationId') locationId?: string,
    @Query('siteSubId') siteSubId?: string,
    @Query('type') type?: string,
  ) {
    const rawType = (type || '').toString().toUpperCase();
    const resourceType = rawType === 'VEHICLE' ? 'VEHICLE' : 'EMPLOYEE';
    return this.service.activeResourcesForSite(locationId, siteSubId, resourceType);
  }

  @Put(':resourceId')
  async upsert(@Param('resourceId') resourceId: string, @Body() body: Partial<AllocationInput>) {
    const rawType = (body.resourceType || '').toString().toUpperCase();
    const resourceType = rawType === 'VEHICLE' ? 'VEHICLE' : 'EMPLOYEE';

    const payload: AllocationInput = {
      resourceId,
      resourceType,
      status: (body.status as any) || 'IDLE',
      locationId: body.locationId || null,
      siteSubId: body.siteSubId || null,
      updatedBy: body.updatedBy || null,
    };
    return this.service.upsertAllocation(payload);
  }

  @Get(':resourceId/history')
  async history(@Param('resourceId') resourceId: string, @Query('type') type?: string) {
    const rawType = (type || '').toString().toUpperCase();
    const resourceType = rawType === 'VEHICLE' ? 'VEHICLE' : 'EMPLOYEE';
    return this.service.getHistory(resourceId, resourceType);
  }
}