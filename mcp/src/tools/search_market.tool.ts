import { CallToolResult } from "@modelcontextprotocol/server";
import z from "zod";
import { api } from "../constant.js";
import { Listing } from "../types/listing.types.js";

export const name = "search_market";
export const description = "Search the Healthlist marketplace for listings/products that match a given query";
export const input = z.object({
    search: z.string(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    category: z.string().array().optional()
});

export async function execute(state: z.infer<typeof input>): Promise<CallToolResult> {
    const res = await api.get(`/listing/search`, { params: state });
    const data: Listing[] = res.data
        ? res.data.map((d: any): Listing => {
            const { additional_questions, document, ...listing } = d;
            const { id, isActive, createdAt, version, ...doc } = document;

            return {
                ...listing,
                document: doc
            }
        })
        : [];

    return {
        content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
        }],
        structuredContent: data
    }
}
