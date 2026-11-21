import { CallToolResult } from "@modelcontextprotocol/server";
import z from "zod";

export const name = "create_session";
export const description = "Search the Healthlist marketplace for listings/products that match a given query";
export const input = z.object({
    query: z.string()
});

export async function execute(state: z.infer<typeof input>): Promise<CallToolResult> {
    return {
        content: []
    }
}
