CREATE TYPE "user_roles" AS ENUM('PATIENT', 'DOCTOR');--> statement-breakpoint
ALTER TABLE "listings" RENAME COLUMN "required_info" TO "additional_questions";--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD COLUMN "is_preliminary" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "intakes" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "intakes" ADD COLUMN "status_changed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_roles" DEFAULT 'PATIENT'::"user_roles" NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_answers" ALTER COLUMN "answer" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_answers" ALTER COLUMN "answered_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "intakes" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "intakes" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "intakes" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "listing_documents" ALTER COLUMN "excerpt" SET DATA TYPE varchar(255) USING "excerpt"::varchar(255);