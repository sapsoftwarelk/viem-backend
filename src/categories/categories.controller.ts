import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()       findAll()                          { return this.categoriesService.findAll(); }
  @Get(':id')  findOne(@Param('id') id: string)   { return this.categoriesService.findOne(+id); }
  @Post()      create(@Body() body: any)           { return this.categoriesService.create(body); }
  @Put(':id')  update(@Param('id') id: string, @Body() body: any) { return this.categoriesService.update(+id, body); }
  @Delete(':id') remove(@Param('id') id: string)  { return this.categoriesService.remove(+id); }
}