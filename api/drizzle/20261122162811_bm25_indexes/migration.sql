-- Custom SQL migration file --

CREATE INDEX IF NOT EXISTS documents_search_index
ON listing_documents
USING paradedb (id, is_active, metadata, name, excerpt, body, search_tags)
WITH (key_field = 'id');

CREATE INDEX IF NOT EXISTS documents_price_index
ON listing_documents (((metadata->>'price')::numeric));

CREATE INDEX IF NOT EXISTS documents_category_index
ON listing_documents 
USING GIN (
    (metadata->'category') jsonb_path_ops
);
