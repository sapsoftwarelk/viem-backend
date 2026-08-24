import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ResourceAllocationsService } from './resource-allocations.service';
import { ResourceAllocationsController } from './resource-allocations.controller';

@Module({
  imports: [PrismaModule],
  providers: [ResourceAllocationsService],
  controllers: [ResourceAllocationsController],
})
export class ResourceAllocationsModule {}
