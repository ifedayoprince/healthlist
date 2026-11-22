import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthUser } from '../common/decorators/current-user.decorator.js';
import db from '../common/db/index.js';
import { assessmentAnswers, assessmentQuestions, assessments } from '../common/db/schema.js';
import { and, eq, sql } from 'drizzle-orm';
import { AssessmentTestItem } from '../common/types.js';
import { SubmitOrUpdateAnswerDto } from './dto/submit-or-update-answer.dto.js';
import { formatAnswer } from '../common/question.js';

@Injectable()
export class AssessmentService {
    async submitAnswer(user: AuthUser, dto: SubmitOrUpdateAnswerDto) {
        const [assessment] = await db.select().from(assessments).where(eq(assessments.userId, user.id));
        const [question] = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.key, dto.questionKey));

        if (!question) {
            throw new BadRequestException(`Question ${dto.questionKey} does not exist.`);
        }

        const existingAnswer = await db
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
            await db
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
        } catch (e) {
            throw new InternalServerErrorException(`Error saving answer to question.`)
        }
    }

    async updateAnswer(user: AuthUser, dto: SubmitOrUpdateAnswerDto) {
        const [assessment] = await db.select().from(assessments).where(eq(assessments.userId, user.id));
        const [question] = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.key, dto.questionKey));

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
        } catch (e) {
            throw new InternalServerErrorException(`Error saving answer to question.`)
        }
    }

    async getAssessmentTest(user: AuthUser) {
        const [assessment] = await db.select().from(assessments).where(eq(assessments.userId, user.id));
        const result = await db.execute<AssessmentTestItem>(
            sql`
SELECT 
	aq.question,
	aq.type,
	aq.options,
	aq.key,
	aq.is_required AS isRequired,
	aa.answer,
	aa.answered_at AS answeredAt
FROM assessment_questions AS aq
LEFT JOIN assessment_answers as aa
	ON aa.assessment_question_id = aq.id
	WHERE
		aa.assessment_id = ${assessment.id}
`);
        const data = result.rows;
        return {
            required: {
                pending: data.filter(entry => entry.isRequired && !entry.answer),
                completed: data.filter(entry => entry.isRequired && entry.answer)
            },
            additional: data.filter(entry => !entry.isRequired)
        }
    }
}
