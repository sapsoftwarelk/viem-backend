import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { SubCategoriesModule } from './sub-categories/sub-categories.module';
import { ConfigModule } from '@nestjs/config';
import { GoodsReceivedNotesModule } from './goods-received-notes/goods-received-notes.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { GoodsIssueNotesModule } from './goods-issue-notes/goods-issue-notes.module';
import { ItemsModule } from './items/items.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { SiteLocationsModule } from './site-locations/site-locations.module';
import { FrontendFallbacksModule } from './frontend-fallbacks/frontend-fallbacks.module';
import { SupplierModule } from './supplier/supplier.module';
import { TransferNotesModule } from './transfer-notes/Transfer notes.module';
import { ReturnNotesModule } from './return-notes/Return notes.module';
import { RepairNotesModule } from './repair-notes/Repair notes.module ';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    SubCategoriesModule,
    GoodsReceivedNotesModule,
    PurchaseOrdersModule,
    GoodsIssueNotesModule,
    ItemsModule,
    RolesModule,
    EmployeesModule,
    TasksModule,
    VehiclesModule,
    SiteLocationsModule,
    FrontendFallbacksModule,
    SupplierModule,
    TransferNotesModule,
    ReturnNotesModule,
    RepairNotesModule,
  ],
})
export class AppModule {}