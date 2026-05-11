import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { SubCategoriesModule } from './sub-categories/sub-categories.module';
import { ItemsModule } from './items/items.module';
<<<<<<< Updated upstream

@Module({
  imports: [PrismaModule, CategoriesModule, SubCategoriesModule, ItemsModule],
=======
import { ConfigModule } from '@nestjs/config';
import { EmployeesModule } from './employees/employees.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CategoriesModule,
    SubCategoriesModule,
    ItemsModule,
    EmployeesModule,
  ],
>>>>>>> Stashed changes
})
export class AppModule {}