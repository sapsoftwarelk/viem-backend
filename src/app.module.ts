import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { SubCategoriesModule } from './sub-categories/sub-categories.module';
import { ConfigModule } from '@nestjs/config';
import { GoodsReceivedNotesModule } from './goods-received-notes/goods-received-notes.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { GoodsIssueNotesModule } from './goods-issue-notes/goods-issue-notes.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    SubCategoriesModule,
    GoodsReceivedNotesModule,
    PurchaseOrdersModule,
    GoodsIssueNotesModule,
    RolesModule,
    EmployeesModule,
  ],
})
export class AppModule {}
