import { Injectable } from '@nestjs/common';
import db from '../common/db/index.js';
import { sql } from 'drizzle-orm';
import { Listing, ListingDocument } from '../common/db/schema.js';
import { listingDocumentJson } from '../common/db/fragments/listing-document.js';

@Injectable()
export class ListingService {
  async findAll() {
    const { rows: listings } = await db
      .execute<
        Listing & { document: ListingDocument | null }
      >(sql`
SELECT 
  l.*,
  ${listingDocumentJson()} AS document
FROM listings as l
LEFT JOIN listing_documents AS ld
  ON ld.listing_id = l.id
  AND ld.is_active = true
      `)

    return listings;
  }

  async findOne(id: string) {
        const { rows: listings } = await db
      .execute<
        Listing & { document: ListingDocument | null }
      >(sql`
SELECT 
  l.*,
  ${listingDocumentJson()} AS document
FROM listings as l
LEFT JOIN listing_documents AS ld
  ON ld.listing_id = l.id
  AND ld.is_active = true
WHERE l.id = ${id}
      `)

    return listings;
  }
}
