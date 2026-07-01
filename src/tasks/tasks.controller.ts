import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';

import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @Body()
    body: {
      title: string;
      description?: string;
      priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
      status?: 'Active' | 'Inactive';
    },
  ) {
    return this.tasksService.create(body);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
      status?: 'Active' | 'Inactive';
    },
  ) {
    return this.tasksService.update(id, body);
  }

  @Put(':id')
  updateViaPut(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
      status?: 'Active' | 'Inactive';
    },
  ) {
    return this.tasksService.update(id, body);
  }
}