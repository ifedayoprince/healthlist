import logger from "./logger.js";

export async function trycatch<T>(
    func: () => T,
    cb: (e: Error) => void
): Promise<T | null> {
    try {
        return await func();
    } catch (e) {
        cb(e as Error);
        return null;
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
