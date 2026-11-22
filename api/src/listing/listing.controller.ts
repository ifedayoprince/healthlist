import { Controller, Get, HttpCode, Param } from '@nestjs/common';
import { ListingService } from './listing.service.js';
import { AllowMCPAccess } from '../common/decorators/allow-mpc-access.decorator.js';

@Controller('listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  // Out-of-scope. (Listings are seeded by seed script for this PoC)
  // @Post()
  // create(@Body() createListingDto: CreateListingDto) {
  //   return this.listingService.create(createListingDto);
  // }

  @Get()
  @AllowMCPAccess()
  @HttpCode(200)
  findAll() {
    return this.listingService.findAll();
  }

  @Get(':id')
  @AllowMCPAccess()
  @HttpCode(200)
  findOne(@Param('id') id: string) {
    return this.listingService.findOne(id);
  }

  // Out-of-scope. (Will require RBAC)
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateListingDto: UpdateListingDto) {
  //   return this.listingService.update(+id, updateListingDto);
  // }

  // Out-of-scope. (Will require RBAC)
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.listingService.remove(+id);
  // }
}
