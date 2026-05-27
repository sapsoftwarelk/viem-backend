import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      position_title: string;
      level: string;
      status: string;
      description: string;

      canCreateUsers?: boolean;
      canRaisePO?: boolean;
      canConfirmDeliveries?: boolean;
      canRunAudits?: boolean;
      canLogMachineHours?: boolean;
    },
  ) {
    return this.rolesService.create(body);
  }
}
