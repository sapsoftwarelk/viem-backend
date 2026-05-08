import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { SubCategoriesModule } from './sub-categories/sub-categories.module';
import { ItemsModule } from './items/items.module';

@Module({
  imports: [PrismaModule, CategoriesModule, SubCategoriesModule, ItemsModule],
})
export class AppModule {}