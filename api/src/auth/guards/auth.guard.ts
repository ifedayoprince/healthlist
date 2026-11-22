import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request, type Response } from "express";
import db from "../../common/db/index.js";
import { authSessions, users } from "../../common/db/schema.js";
import { eq } from "drizzle-orm";
import { generateSessionToken, TOKEN_EXPIRES_AHEAD_MS } from "../../common/session-token.util.js";
import { Reflector } from "@nestjs/core";
import { Public } from "../../common/decorators/public.decorator.js";
import { email } from "envsafe";
import logger from "../../common/logger.js";
import { AllowMCPAccess } from "../../common/decorators/allow-mpc-access.decorator.js";
import env from "../../common/env.js";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(
        context: ExecutionContext
    ): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse() as Response;
        const sessionToken = request.cookies['sid'] ?? null;

        if (this.reflector.getAllAndOverride(Public, [context.getHandler(), context.getClass()]))
            return true;

        const isMcpAllowed = this.reflector.getAllAndOverride(AllowMCPAccess, [context.getClass(), context.getHandler()]);
        const mcpToken = (request as Request).headers['mcp-token'] as string;
        if (isMcpAllowed && mcpToken) {
            return await this.authenticateMcp(mcpToken, request.ip);
        }

        if (!sessionToken)
            throw new UnauthorizedException(`Missing session token.`)

        const [session] = await db
            .select()
            .from(authSessions)
            .where(eq(authSessions.token, sessionToken));
        if (
            !session
            || Date.now() > session.expiresAt.getTime()
            || Date.now() > session.maxLifespan.getTime()
        )
            throw new UnauthorizedException(`Invalid or expired session token`)

        // Refresh once the token has not reached its max lifespan
        // And the token is past it's half life
        await this.refreshSessionToken(response, session);
        request.user = await this.getUser(session.userId);
        return true;
    }

    async authenticateMcp(token: string, ip: string) {
        if (env.MCP_SERVER_IP.trim() && ip != env.MCP_SERVER_IP)
            throw new UnauthorizedException('Unauthorized MCP server IP.');

        if (token == env.MCP_SERVER_TOKEN)
            return true;

        throw new UnauthorizedException('Invalid MCP server token provided.');
    }

    async refreshSessionToken(
        response: Response,
        session: typeof authSessions.$inferSelect
    ) {
        if (
            Date.now() < session.maxLifespan.getTime()
            && Date.now() > session.issuedAt.getTime() + (TOKEN_EXPIRES_AHEAD_MS / 2)
        ) {
            const newSessionToken = generateSessionToken();
            await db
                .update(authSessions)
                .set({
                    token: newSessionToken.token,
                    expiresAt: newSessionToken.expiresAt,
                    issuedAt: new Date()
                })
                .where(eq(authSessions.id, session.id));

            response.cookie('sid', newSessionToken.token, {
                httpOnly: true,
                sameSite: 'lax',
                expires: newSessionToken.expiresAt,
                maxAge: newSessionToken.expiresAt.getTime() - Date.now()
            });
        }
    }

    async getUser(userId: string) {
        const [user] = await db
            .select({
                name: users.name,
                id: users.id,
                joinedAt: users.joinedAt,
                email: users.email
            })
            .from(users)
            .where(eq(users.id, userId));
        if (!user) {
            logger.error({
                message: `User ${userId} not found in table`,
                context: AuthGuard.name
            });
            throw new UnauthorizedException(`Invalid or expired session token`)
        }

        return user;
    }
}
