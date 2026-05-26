import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // CREATE TASK
  @Post()
  create(
    @Body()
    body: {
      title: string;
      description?: string;
      priority?: 'Low' | 'Medium' | 'High' | 'Critical';
      status?: 'Active' | 'Inactive';
    },
  ) {
    return this.tasksService.create(body);
  }

  // GET ALL TASKS
  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  // GET SINGLE TASK
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  // UPDATE TASK
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      priority?: 'Low' | 'Medium' | 'High' | 'Critical';
      status?: 'Active' | 'Inactive';
    },
  ) {
    return this.tasksService.update(id, body);
  }
}
