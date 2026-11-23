import { CallToolResult } from "@modelcontextprotocol/server";
import z from "zod";
import { api } from "../constant.js";
import { Listing } from "../types/listing.types.js";

export const name = "fetch_listing";
export const description = "Fetch a particular product listing from Healthlist.";
export const input = z.object({
    listingId: z.string()
});

export async function execute(state: z.infer<typeof input>): Promise<CallToolResult> {
    const res = await api.get(`listing/${state.listingId}`);
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
        content: [
            {
                type: 'text',
                text: JSON.stringify(data, null, 2)
            },
        ],
        structuredContent: data
    };
}
