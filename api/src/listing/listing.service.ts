import { Injectable } from '@nestjs/common';
import db from '../common/db/index.js';
import { sql } from 'drizzle-orm';
import { Listing, ListingDocument } from '../common/db/schema.js';
import { listingDocumentJson } from '../common/db/fragments/listing-document.js';
import { createCursor, decodeCursor } from '../common/cursor.js';
import z from 'zod';

export const searchQueries = z.object({
  search: z.string(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  category: z.preprocess(
    (val) => (typeof val == 'string' ? [val] : val),
    z.string().array().optional()
  )
});

@Injectable()
export class ListingService {
  async search(
    query: z.infer<typeof searchQueries>
  ) {
    const result = await db.execute(sql`
SELECT 
  l.*,
  ${listingDocumentJson()} AS document,
  pdb.score(ld.id) AS relevance_score
FROM listing_documents as ld
LEFT JOIN listings AS l
  ON ld.listing_id = l.id
  AND ld.is_active = true
WHERE
  (
    ld.name ||| ${query.search}::pdb.fuzzy(1, t)::pdb.boost(3)
    OR ld.search_tags ||| ${query.search}::pdb.fuzzy(1, t)::pdb.boost(1.5)
    OR ld.excerpt ||| ${query.search}::pdb.boost(1.25)
    OR ld.body ||| ${query.search}
  )

  ${query.minPrice != null ? sql`AND ((ld.metadata->>'price')::numeric) >= ${query.minPrice}` : sql``}
  ${query.maxPrice != null ? sql`AND ((ld.metadata->>'price')::numeric) <= ${query.maxPrice}` : sql``}
  ${query.category
        ? sql`AND (ld.metadata->'category')::jsonb @> ${JSON.stringify(query.category)}::jsonb`
        : sql``}

ORDER BY relevance_score DESC
LIMIT 10;
`, 'objects');

    return result;
  }

  async findAll(limit: number, cursorToken?: string) {
    const cursor = decodeCursor(cursorToken);

    const listings = await db.query.listings.findMany({
      where: {
        ...(cursor
          ? {
            id: {
              gt: cursor.id
            },
            createdAt: {
              gt: new Date(cursor.timestamp)
            }
          }
          : {}
        )
      },
      with: {
        documents: {
          where: {
            isActive: true
          }
        }
      },
      orderBy: {
        id: 'asc',
        createdAt: 'asc'
      },
      limit: limit + 1
    })

    const hasMore = listings.length > limit;
    const data = listings.slice(0, limit);
    return {
      data,
      cursor: hasMore
        ? createCursor({
          id: listings.at(-1)!.id,
          timestamp: listings.at(-1)!.createdAt.toISOString()
        })
        : null
    };
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
