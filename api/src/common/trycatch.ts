export async function trycatch<T, Y>(
    func: () => T,
    cb: (e: Error) => Y
): Promise<T | Y | null> {
    try {
        return await func();
    } catch (e) {
        const res = cb(e as Error);
        return res ?? null;
    }
}

export async function trycatchE<T>(
    func: () => T,
    cb: (e: Error) => Error | Promise<Error>
): Promise<T> {
    try {
        return await func();
    } catch (e) {
        throw await cb(e as Error);
    }
}
