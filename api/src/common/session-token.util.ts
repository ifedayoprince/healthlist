import { randomBytes } from "crypto";

export const TOKEN_EXPIRES_AHEAD_MS = 7 * 24 * 3600 * 1000;
const TOKEN_MAX_LIFESPAN_MS = 30 * 24 * 3600 * 1000;

export function generateSessionToken() {
    const token = randomBytes(32).toString('base64url');
    const now = Date.now();
    
    return {
        token,
        expiresAt: new Date(now + TOKEN_EXPIRES_AHEAD_MS),
        maxLifespan: new Date(now + TOKEN_MAX_LIFESPAN_MS),
    }
}