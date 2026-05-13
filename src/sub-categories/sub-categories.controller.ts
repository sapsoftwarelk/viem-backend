import { Controller, Get, Post, Body } from '@nestjs/common';
import { SubCategoriesService } from './sub-categories.service';

@Controller('sub-categories')
export class SubCategoriesController {
  constructor(private readonly subCategoriesService: SubCategoriesService) {}

  @Post()
  async create(@Body() data: { name: string; slug: string; code: string; categoryId: number }) {
    return this.subCategoriesService.create(data);
  }

  @Get()
  async findAll() {
    return this.subCategoriesService.findAll();
  }
}
