import { Module } from '@nestjs/common';
import { ListingService } from './listing.service.js';
import { ListingController } from './listing.controller.js';

@Module({
  controllers: [ListingController],
  providers: [ListingService],
})
export class ListingModule {}
