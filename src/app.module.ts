import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { SubCategoriesModule } from './sub-categories/sub-categories.module';
import { ItemsModule } from './items/items.module';
import { ConfigModule } from '@nestjs/config';
import { GoodsReceivedNotesModule } from './goods-received-notes/goods-received-notes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CategoriesModule,
    SubCategoriesModule,
    ItemsModule,
    GoodsReceivedNotesModule,
  ],
})
export class AppModule {}
