import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SiteLocationsController } from './site-locations.controller';
import { SiteLocationsService } from './site-locations.service';

@Module({
  imports: [PrismaModule],
  controllers: [SiteLocationsController],
  providers: [SiteLocationsService],
})
export class SiteLocationsModule {}
