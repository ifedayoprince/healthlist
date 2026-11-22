import { sql } from "drizzle-orm";

export const listingDocumentJson = (alias = 'ld') => (`
CASE
  WHEN ${sql.raw(`${alias}.id`)} IS NOT NULL THEN
    json_build_object(
      'id', ${sql.raw(`${alias}.id`)},
      'version', ${sql.raw(`${alias}.version`)},
      'isActive', ${sql.raw(`${alias}.is_active`)},
      'name', ${sql.raw(`${alias}.name`)},
      'excerpt', ${sql.raw(`${alias}.excerpt`)},
      'metadata', ${sql.raw(`${alias}.metadata`)},
      'createdAt', ${sql.raw(`${alias}.created_at`)}
    )
  ELSE NULL
END
`);
