import { Module } from '@nestjs/common';
import { FrontendFallbacksController } from './frontend-fallbacks.controller';
import { FrontendFallbacksService } from './frontend-fallbacks.service';

@Module({
  controllers: [FrontendFallbacksController],
  providers: [FrontendFallbacksService],
})
export class FrontendFallbacksModule {}
