import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import db from '../common/db/index.js';
import { assessments, authSessions, users } from '../common/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { hash, verify } from 'argon2';
import logger from '../common/logger.js';
import { generateSessionToken } from '../common/session-token.util.js';
import { AssessmentTestItem } from '../common/types.js';
import { trycatchE } from '../common/trycatch.js';
import { type Response } from 'express';
import { SigninUserDto } from './dto/sign-in.dto.js';
import { SignupUserDto } from './dto/sign-up.dto.js';

@Injectable()
export class AuthService {
    constructor() { }

    async signinUser(res: Response, dto: SigninUserDto) {
        const [user] = await db.select().from(users).where(eq(users.email, dto.email));
        if (!user)
            throw new UnauthorizedException(`Invalid credentials.`)

        if (!(await verify(user.password, dto.password)))
            throw new UnauthorizedException(`Invalid credentials.`)

        const { token, expiresAt, maxLifespan } = generateSessionToken();

        const result = await db.transaction(async (tx) => {
            await tx
                .insert(authSessions)
                .values({
                    userId: user.id,
                    token,
                    expiresAt,
                    maxLifespan
                })
                .onConflictDoUpdate({
                    target: [authSessions.userId],
                    set: {
                        token, expiresAt, maxLifespan
                    }
                });

            let [assessment] = await tx
                .select()
                .from(assessments)
                .where(eq(assessments.userId, user.id));
            if (!assessment)
                [assessment] = await tx
                    .insert(assessments)
                    .values({ userId: user.id })
                    .returning();

            const pendingQuestions = await tx.execute<AssessmentTestItem[]>(
                sql`
SELECT 
    aq.question,
    aq.type,
    aq.options,
    aq.key
FROM assessment_questions AS aq
WHERE
    aq.is_preliminary = TRUE
    AND aq.is_required = TRUE
    AND NOT EXISTS (
        SELECT 1
        FROM assessment_answers as aa
        WHERE
            aa.assessment_question_id = aq.id
            AND aa.assessment_id = ${assessment.id}
    )
`);

            return {
                pendingQuestions: pendingQuestions.rows
            };
        });

        res.cookie('sid', token, {
            httpOnly: true,
            sameSite: "lax",
            path: '/',
            expires: expiresAt,
            maxAge: expiresAt.getTime() - Date.now()
        });

        return {
            isFirstSignup: false,
            name: user.name,
            email: user.email,
            hasPendingAssessment: result.pendingQuestions.length > 0
        }
    }
    async signupUser(res: Response, dto: SignupUserDto) {
        const [existingUser] = await db.select().from(users).where(eq(users.email, dto.email));
        if (existingUser)
            throw new ConflictException(`This email is already in use.`)

        const passwordHash = await trycatchE(() => hash(dto.password),
            () => {
                logger.error({
                    message: "Error hashing the provided password.",
                    context: AuthService.name
                });
                return new InternalServerErrorException('We ran into an issue during authentication. Please try again later.')
            });

        const { token, expiresAt, maxLifespan } = generateSessionToken();

        const result = await db.transaction(async (tx) => {
            const [user] = await tx
                .insert(users)
                .values({
                    name: dto.name!,
                    email: dto.email,
                    password: passwordHash!
                })
                .returning()

            await tx
                .insert(authSessions)
                .values({
                    userId: user.id,
                    token: token,
                    expiresAt,
                    maxLifespan
                });

            await tx
                .insert(assessments)
                .values({ userId: user.id });

            return { user }
        })

        res.cookie('sid', token, {
            httpOnly: true,
            sameSite: "lax",
            path: '/',
            expires: expiresAt,
            maxAge: expiresAt.getTime() - Date.now()
        });

        return {
            isFirstSignup: true,
            name: result.user.name,
            email: result.user.email,
            hasPendingAssessment: true
        }
    }
}
