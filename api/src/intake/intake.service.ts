import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateIntakeSessionDto } from './dto/create-intake.dto.js';
import db, { DbClient, DbTransaction } from '../common/db/index.js';
import { assessmentAnswers, Intake, intakeListings, intakes, listings } from '../common/db/schema.js';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import env from '../common/env.js';
import { AuthUser } from '../common/decorators/current-user.decorator.js';
import logger from '../common/logger.js';
import { SubmitIntakeSessionDto } from './dto/submit-intake.dto.js';
import { formatAnswer } from '../common/questions.js';
import { createCursor, Cursor, decodeCursor } from '../common/cursor.js';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class IntakeService {

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async clearUnclaimedIntakeSessions() {
    await db.execute(sql`
DELETE *
FROM intakes AS i
WHERE
  i.status = 'PENDING'
  AND i.created_at < (NOW() - INTERVAL '14 days')
`);
  }

  async getIntakes(user: AuthUser, limit = 10, cursorToken?: string) {
    const cursor = decodeCursor(cursorToken);

    const intakes = await db.query.intakes.findMany({
      where: {
        userId: user.id,
        ...(cursor
          ? {
            createdAt: {
              gt: new Date(cursor.timestamp)
            },
            id: {
              gt: cursor.id
            }
          }
          : {}),
        status: {
          notIn: ["PENDING"]
        }
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

  async create(
    dto: CreateIntakeSessionDto
  ) {
    if (dto.products.length == 0)
      throw new BadRequestException(`At least one product/listing must be attached.`);

    const entries = await db
      .select()
      .from(listings)
      .where(
        inArray(listings.id, dto.products)
      );

    const key = randomBytes(16).toString('base64url');
    await db.transaction(async (tx) => {
      const [intakeSession] = await tx
        .insert(intakes)
        .values({ key })
        .returning()

      await tx
        .insert(intakeListings)
        .values(entries.map(e => ({
          listingId: e.id,
          intakeId: intakeSession.id
        })));
    })

    return {
      sessionUrl: `${env.FRONTEND_URL}/i/${key}`
    };
  }

  async getIntakeSession(
    user: AuthUser,
    key: string,
    tx: DbClient | DbTransaction = db
  ) {
    const session = await tx.query.intakes.findFirst({
      where: {
        key,
        OR: [
          { userId: { isNull: true } },
          { userId: user.id }
        ]
      },
      with: {
        listings: {
          with: {
            documents: {
              where: { isActive: true },
              limit: 1
            }
          }
        }
      }
    })

    if (!session) {
      throw new NotFoundException(`Intake session not found.`)
    }

    const assessment = await tx.query.assessments.findFirst({
      where: {
        userId: user.id
      }
    });
    if (!assessment) {
      throw new InternalServerErrorException(`Assessment entry not available.`);
    }

    const questionKeys = new Set(session.listings
      .flatMap((a) => a.additionalQuestions));

    const questions = session.status == "PENDING" && questionKeys.size > 0
      ? await tx.query.assessmentQuestions.findMany({
        where: {
          key: {
            in: [...questionKeys]
          }
        },
        with: {
          assessmentAnswers: {
            where: {
              assessmentId: assessment.id
            }
          }
        }
      })
      : [];

    const { userId: _, ...sess } = session;

    return {
      ...sess,
      questions
    }
  }

  /** User clicked an action button */
  async submitIntakeSession(
    user: AuthUser,
    dto: SubmitIntakeSessionDto
  ) {
    // Ensure all required preliminary questions are answered
    const assessment = await this.assertPreliminaryTestCompleted(user);

    const session = await db.query.intakes.findFirst({
      where: {
        key: dto.intakeKey,
        OR: [
          { userId: { isNull: true } },
          { userId: user.id }
        ]
      }
    })
    if (!session) {
      throw new NotFoundException(`Intake session not found.`)
    }
    if (session.status != "PENDING") {
      logger.error({
        message: `Session is no longer modifiable`,
        userId: user.id,
        sessionId: session.id,
        context: IntakeService.name
      });
      throw new ConflictException(`Session is no longer modifiable.`);
    }

    const attachedListings = await db.query.intakeListings.findMany({
      where: {
        intakeId: session.id
      }
    });
    const removedSet = new Set(dto.removedListings);
    const remainingCount = attachedListings.filter(l => !removedSet.has(l.listingId)).length;
    if (remainingCount === 0) {
      throw new ConflictException(`At least one listing must be present.`)
    }

    await db.transaction(async (tx) => {
      await tx.update(intakes)
        .set({ userId: user.id })
        .where(eq(intakes.id, session.id));

      // Delete removed listings
      if (dto.removedListings.length > 0)
        await tx.delete(intakeListings)
          .where(and(
            inArray(intakeListings.listingId, dto.removedListings),
            eq(intakeListings.intakeId, session.id)
          ));

      // Ensure all required questions are answered.
      const fullSession = await this.assertRequiredAnswersProvided(user, dto, tx);

      const isUnanswered = fullSession.questions
        .filter(q => q.assessmentAnswers.length == 0);
      const valuesToInsert = isUnanswered
        .map(q => {
          const answer = dto.answers.find(d => d.questionKey == q.key);
          if (!answer) return null;

          return {
            assessmentId: assessment!.id,
            answer: formatAnswer(answer.answer, q.type),
            assessmentQuestionId: q.id
          } as typeof assessmentAnswers.$inferInsert
        })
        .filter(a => !!a);
      if (valuesToInsert.length > 0)
        await tx
          .insert(assessmentAnswers)
          .values(valuesToInsert)
          .onConflictDoNothing();

      await tx
        .update(intakes)
        .set({
          status: 'IN_REVIEW',
          submittedAt: new Date()
        })
        .where(eq(intakes.id, session.id))
    });

    return {
      success: 'OK'
    }
  }

  async assertPreliminaryTestCompleted(user: AuthUser) {
    const assessment = await db.query.assessments.findFirst({
      where: {
        userId: user.id
      }
    });
    if (!assessment) {
      throw new InternalServerErrorException(`Assessment entry not available.`);
    }

    const preliminaryQuestions = await db.query.assessmentQuestions.findMany({
      where: {
        isPreliminary: true,
        isRequired: true,
      },
      with: {
        assessmentAnswers: {
          where: {
            assessmentId: assessment.id
          }
        }
      }
    });

    const preliminaryAnswers = preliminaryQuestions.flatMap(a => a.assessmentAnswers);

    if (preliminaryQuestions.length != preliminaryAnswers.length) {
      logger.error({
        message: `The user has not completed their preliminary assessment test.`,
        userId: user.id,
        context: IntakeService.name
      });
      throw new UnprocessableEntityException(`You have not completed your preliminary assessment`);
    }

    return assessment;
  }

  async assertRequiredAnswersProvided(
    user: AuthUser,
    dto: SubmitIntakeSessionDto,
    tx: DbClient | DbTransaction
  ) {
    const session = await this.getIntakeSession(user, dto.intakeKey, tx);

    const answeredKeys = new Set(dto.answers.map(a => a.questionKey));
    const requiredKeys = new Set(session.questions
      .filter(q => q.isRequired && q.assessmentAnswers.length == 0)
      .map(q => q.key));

    if (!requiredKeys.isSubsetOf(answeredKeys)) {
      logger.error({
        message: `Answer all the required questions`,
        userId: user.id,
        context: IntakeService.name
      });
      throw new BadRequestException(`Answer all the required questions. Missing: ${[...requiredKeys.difference(answeredKeys)].join(', ')}`)
    }

    return session;
  }
}
