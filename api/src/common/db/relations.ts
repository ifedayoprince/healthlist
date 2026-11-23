import { defineRelations } from "drizzle-orm";
import * as schema from './schema.js';

export const relations = defineRelations(schema, (r)=>({
    users: {
        assessment: r.one.assessments({
            from: r.users.id,
            to: r.assessments.userId
        }),
        intakes: r.many.intakes()
    },
    authSessions: {
        user: r.one.users({
            from: r.authSessions.userId,
            to: r.users.id
        })
    },
    assessments: {
        user: r.one.users({
            from: r.assessments.userId,
            to: r.users.id
        }),
        assessmentAnswers: r.many.assessmentAnswers()
    },
    assessmentAnswers: {
        assessment: r.one.assessments({
            from: r.assessmentAnswers.assessmentId,
            to: r.assessments.id
        }),
        assessmentQuestion: r.one.assessmentQuestions({
            from: r.assessmentAnswers.assessmentQuestionId,
            to: r.assessmentQuestions.id
        })
    },
    assessmentQuestions: {
        assessmentAnswers: r.many.assessmentAnswers({
            from: r.assessmentQuestions.id,
            to: r.assessmentAnswers.assessmentQuestionId
        })
    },
    intakes: {
        user: r.one.users({
            from: r.intakes.userId,
            to: r.users.id
        }),
        intakeListings: r.many.intakeListings(),
        listings: r.many.listings({
            from: r.intakes.id.through(r.intakeListings.intakeId),
            to: r.listings.id.through(r.intakeListings.listingId)
        })
    },
    intakeListings: {
        intake: r.one.intakes({
            from: r.intakeListings.intakeId,
            to: r.intakes.id
        }),
        listing: r.one.listings({
            from: r.intakeListings.listingId,
            to: r.listings.id
        })
    },
    listings: {
        documents: r.many.listingDocuments()
    },
    listingDocuments: {
        listing: r.one.listings({
            from: r.listingDocuments.listingId,
            to: r.listings.id
        })
    }
}))