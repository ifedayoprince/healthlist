import { CallToolResult } from "@modelcontextprotocol/server";
import z from "zod";
import { api } from "../constant.js";

export const name = "create_session";
export const description = "Create a intake session. This tool will give a link that redirects the user to Healthlist. ALWAYS ask the user to confirm if you can create an intake session BEFORE calling this tool.";
export const input = z.object({
    products: z.string().array().describe(`Array of listing/product IDs for the doctor to review.`)
});

export async function execute(state: z.infer<typeof input>): Promise<CallToolResult> {
    if (state.products.length == 0)
        throw new Error(`At least one product must be attached.`)

    const { data } = await api.post('/intake', state);
    return {
        content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
        }],
        structuredContent: data
    }
}
