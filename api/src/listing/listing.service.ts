import { Injectable } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { UpdateListingDto } from './dto/update-listing.dto.js';

@Injectable()
export class ListingService {
  create(createListingDto: CreateListingDto) {
    return 'This action adds a new listing';
  }

  findAll() {
    return `This action returns all listing`;
  }

  findOne(id: number) {
    return `This action returns a #${id} listing`;
  }

  update(id: number, updateListingDto: UpdateListingDto) {
    return `This action updates a #${id} listing`;
  }

  remove(id: number) {
    return `This action removes a #${id} listing`;
  }
}
