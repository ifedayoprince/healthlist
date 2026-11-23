import { BadRequestException, Controller, Get, HttpCode, Param, Query } from '@nestjs/common';
import { ListingService, searchQueries } from './listing.service.js';
import { AllowMCPAccess } from '../common/decorators/allow-mpc-access.decorator.js';
import z from 'zod';



@Controller('listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) { }

  // Out-of-scope. (Listings are seeded by seed script for this PoC)
  // @Post()
  // create(@Body() createListingDto: CreateListingDto) {
  //   return this.listingService.create(createListingDto);
  // }

  @Get('search')
  @AllowMCPAccess()
  @HttpCode(200)
  search(@Query() queries: z.infer<typeof searchQueries>) {
    const search = searchQueries.safeParse(queries);
    if (!search.success) {
      throw new BadRequestException(`Invalid search queries provided. ${z.treeifyError(search.error)}`);
    }
    return this.listingService.search(search.data);
  }

  @Get()
  @AllowMCPAccess()
  @HttpCode(200)
  findAll(
    @Query('nextCursor') nextCursor?: string,
    @Query('limit') limit?: string
  ) {
    return this.listingService.findAll(
      limit ? parseInt(limit) : 10,
      nextCursor
    );
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
