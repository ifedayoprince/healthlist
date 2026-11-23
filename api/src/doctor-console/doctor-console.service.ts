import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SubmitReviewDto } from './dto/submit-review.dto.js';
import db from '../common/db/index.js';
import { intakes } from '../common/db/schema.js';
import { eq } from 'drizzle-orm';
import { createCursor, decodeCursor } from '../common/cursor.js';

@Injectable()
export class DoctorConsoleService {
    async getAssessment(userId: string) {
        const assessment = await db.query.assessments.findFirst({
            columns: {
                userId: false
            },
            where: {
                userId
            },
            with: {
                assessmentAnswers: {
                    columns: {
                        assessmentId: false,
                        assessmentQuestionId: false
                    },
                    with: {
                        assessmentQuestion: true
                    }
                }
            }
        })

        return assessment;
    }

    async submitReview(intakeId: string, dto: SubmitReviewDto) {
        return await db.transaction(async (tx) => {
            const intake = await tx.query.intakes.findFirst({
                where: {
                    id: intakeId
                }
            });
            if (!intake) {
                throw new NotFoundException('Intake session not found');
            }

            if (intake.status != 'IN_REVIEW') {
                throw new ConflictException(`Intake has not been submitted for review or has been reviewed already.`)
            }

            await tx
                .update(intakes)
                .set({
                    status: dto.isApproved ? 'APPROVED' : 'REJECTED',
                    doctorRemark: dto.remark,
                    statusChangedAt: new Date()
                })
                .where(eq(intakes.id, intake.id));

            return { success: 'OK' }
        })
    }

    async listIntakes(limit: number, cursorToken?: string) {
        const cursor = decodeCursor(cursorToken);

        const intakes = await db.query.intakes.findMany({
            where: {
                status: 'IN_REVIEW',
                ...(cursor
                    ? {
                        createdAt: {
                            gt: new Date(cursor.timestamp)
                        },
                        id: {
                            gt: cursor.id
                        }
                    }
                    : {})
            },
            with: {
                listings: {
                    with: {
                        documents: {
                            where: {
                                isActive: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                id: 'asc',
                createdAt: 'asc'
            },
            limit: limit + 1
        });

        const hasMore = intakes.length > limit;
        const data = intakes.slice(0, limit);

        return {
            data,
            cursor: hasMore
                ? createCursor({
                    id: intakes.at(-1)!.id,
                    timestamp: intakes.at(-1)!.createdAt.toISOString()
                })
                : null
        }
    }

    async getIntake(intakeId: string) {
        const intake = await db.query.intakes.findFirst({
            where: {
                id: intakeId
            }
        });
        if (!intake) {
            throw new NotFoundException('Intake session not found');
        }

        return intake;
    }
}
