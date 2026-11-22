import * as z from 'zod';

const Cursor = z.object({
    id: z.uuid(),
    timestamp: z.iso.datetime()
})
export type Cursor = z.infer<typeof Cursor>;

export function decodeCursor(cursor?: string): Cursor | null {
    if (!cursor) return null;
    try {
        const obj = JSON.parse(
            Buffer.from(cursor, 'base64url').toString('utf8')
        );
        return Cursor.parse(obj);
    } catch (e) {
        return null;
    }
}

export function createCursor(cursor: Cursor): string | null {
    if (!Cursor.validate(cursor))
        return null;

    return Buffer
        .from(JSON.stringify(cursor))
        .toString('base64url');
}
