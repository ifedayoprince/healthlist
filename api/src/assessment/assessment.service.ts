import { Injectable } from '@nestjs/common';
import { AuthUser } from '../common/decorators/current-user.decorator.js';
import db from '../common/db/index.js';
import { assessments } from '../common/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { AssessmentTestItem } from '../common/types.js';

@Injectable()
export class AssessmentService {
    async getAssessmentTest(user: AuthUser) {
        const [assessment] = await db.select().from(assessments).where(eq(assessments.userId, user.id));
        const result = await db.execute<AssessmentTestItem[]>(
            sql`
SELECT 
    aq.question,
    aq.type,
    aq.options,
    aq.key
    aa.answer,
FROM assessment_questions AS aq
LEFT JOIN assessment_answers as aa
    ON aa.assessment_question_id = aq.id
`);

        return {
            totalCount,
            pending: pendingQuestions,
            completed: completedQuestions,
            additional
        }
    }
}
