import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { AuthenticateUserDto } from './dto/authenticate.dto.js';
import db from '../common/db/index.js';
import { assessments, authSessions, users } from '../common/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { hash, verify } from 'argon2';
import logger from '../common/logger.js';
import { generateSessionToken } from '../common/session-token.util.js';
import { AssessmentTestItem } from '../common/types.js';
import { trycatchE } from '../common/trycatch.js';
import { type Response } from 'express';

@Injectable()
export class AuthService {
    constructor() { }

    async authenticateUser(res: Response, dto: AuthenticateUserDto) {
        const [existingUser] = await db.select().from(users).where(eq(users.email, dto.email));

        let isFirstSignup = false;
        if (!existingUser) {
            logger.info({
                message: `User has not signed up yet. Proceeding with signup flag`,
                context: AuthService.name
            });
            if (!dto.name)
                throw new BadRequestException(`'name' is required when the signing up for the first time.`);

            isFirstSignup = true;
        }

        if (
            !isFirstSignup
            && !(await verify(existingUser.password, dto.password))
        )
            throw new UnauthorizedException(`Invalid credentials.`)

        const passwordHash = isFirstSignup
            ? await trycatchE(() => hash(dto.password),
                () => {
                    logger.error({
                        message: "Error hashing the provided password.",
                        context: AuthService.name
                    });
                    return new InternalServerErrorException('We ran into an issue during authentication. Please try again later.')
                })
            : null;


        const { token, expiresAt, maxLifespan } = generateSessionToken();

        const result = await db.transaction(async (tx) => {
            const [user] = isFirstSignup
                ? await tx
                    .insert(users)
                    .values({
                        name: dto.name!,
                        email: dto.email,
                        password: passwordHash!
                    })
                    .returning()
                : [existingUser];

            await tx
                .insert(authSessions)
                .values({
                    userId: user.id,
                    token: token,
                    expiresAt,
                    maxLifespan
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
                pendingQuestions: pendingQuestions.rows,
                user
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
            isFirstSignup,
            name: result.user.name,
            email: result.user.email,
            hasPendingAssessment: result.pendingQuestions.length > 0
        }
    }
}
