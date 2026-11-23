export interface ListingMetadata {
    price: number;
    category: string[];
}

export interface ListingDocument {
    name: string;
    excerpt: string;
    metadata: ListingMetadata;
}

export interface Listing {
    id: string;
    slug: string;
    brand: string;
    reviews: number;
    product_image: string;
    created_at: string;
    document: ListingDocument;
}
