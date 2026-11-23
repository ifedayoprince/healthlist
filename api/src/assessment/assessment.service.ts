import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthUser } from '../common/decorators/current-user.decorator.js';
import db from '../common/db/index.js';
import { assessmentAnswers } from '../common/db/schema.js';
import { and, eq, sql } from 'drizzle-orm';
import { SubmitOrUpdateAnswerDto } from './dto/submit-or-update-answer.dto.js';
import { formatAnswer } from '../common/questions.js';
import logger from '../common/logger.js';

@Injectable()
export class AssessmentService {
    async submitAnswer(user: AuthUser, dto: SubmitOrUpdateAnswerDto) {
        await db.transaction(async (tx) => {
            const assessment = await tx.query.assessments.findFirst({
                where: {
                    userId: user.id
                }
            });
            if (!assessment)
                throw new InternalServerErrorException(`Assessment entry not found.`);

            const question = await tx.query.assessmentQuestions.findFirst({
                where: {
                    key: dto.questionKey
                }
            });

            if (!question) {
                throw new BadRequestException(`Question ${dto.questionKey} does not exist.`);
            }

            const existingAnswer = await tx
                .select()
                .from(assessmentAnswers)
                .where(and(
                    eq(assessmentAnswers.assessmentId, assessment.id),
                    eq(assessmentAnswers.assessmentQuestionId, question.id)
                ));

            if (existingAnswer.length > 0) {
                throw new BadRequestException(`An answer to this assessment question has already been provided.`)
            }

            try {
                await tx
                    .insert(assessmentAnswers)
                    .values({
                        assessmentId: assessment.id,
                        assessmentQuestionId: question.id,
                        answer: formatAnswer(
                            dto.answer,
                            question.type
                        )
                    });

                return { success: 'OK' }
            } catch (e: any) {
                logger.error({
                    message: e.message,
                    stack: e.stack,
                    context: AssessmentService.name
                });
                throw new InternalServerErrorException(`Error saving answer to question.`)
            }
        })
    }

    async updateAnswer(user: AuthUser, dto: SubmitOrUpdateAnswerDto) {
        const assessment = await db.query.assessments.findFirst({
            where: {
                userId: user.id
            }
        });
        if (!assessment)
            throw new InternalServerErrorException(`Assessment entry not found.`);

        const question = await db.query.assessmentQuestions.findFirst({
            where: {
                key: dto.questionKey
            }
        });

        if (!question) {
            throw new BadRequestException(`Question ${dto.questionKey} does not exist.`);
        }

        try {
            await db
                .insert(assessmentAnswers)
                .values({
                    assessmentId: assessment.id,
                    assessmentQuestionId: question.id,
                    answer: formatAnswer(
                        dto.answer,
                        question.type
                    )
                })
                .onConflictDoUpdate({
                    target: [
                        assessmentAnswers.assessmentId,
                        assessmentAnswers.assessmentQuestionId
                    ],
                    set: {
                        answeredAt: new Date(),
                        answer: sql`EXCLUDED.answer`
                    }
                })

            return { success: 'OK' }
        } catch (e: any) {
            logger.error({
                message: e.message,
                stack: e.stack,
                context: AssessmentService.name
            });
            throw new InternalServerErrorException(`Error saving answer to question.`)
        }
    }

    async getAssessmentTest(user: AuthUser) {
        const assessment = await db.query.assessments.findFirst({
            where: {
                userId: user.id
            }
        });
        if (!assessment)
            throw new InternalServerErrorException(`Assessment entry not found.`);

        const result = await db.query.assessmentQuestions.findMany({
            where: {
                isPreliminary: true
            },
            with: {
                assessmentAnswers: {
                    where: {
                        assessmentId: assessment!.id
                    }
                }
            }
        });

        return {
            preliminary: {
                pending: result.filter(entry => entry.isRequired && entry.assessmentAnswers.length == 0),
                completed: result.filter(entry => entry.isRequired && entry.assessmentAnswers.length > 0)
            }
        }
    }
}
