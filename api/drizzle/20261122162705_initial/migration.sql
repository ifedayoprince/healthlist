CREATE TYPE "intake_status" AS ENUM('PENDING', 'IN_REVIEW', 'REJECTED', 'APPROVED');--> statement-breakpoint
CREATE TYPE "question_types" AS ENUM('MULTI_SELECT', 'YES_NO', 'YES_NO_TEXT', 'TEXT_LIST');--> statement-breakpoint
CREATE TABLE "assessment_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"assessment_id" uuid NOT NULL,
	"assessment_question_id" uuid NOT NULL,
	"answer" jsonb,
	"answered_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "assessment_answers_assessment_id_assessment_question_id_unique" UNIQUE("assessment_id","assessment_question_id")
);
--> statement-breakpoint
CREATE TABLE "assessment_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"key" varchar(50) NOT NULL UNIQUE,
	"question" text NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"type" "question_types" NOT NULL,
	"options" jsonb
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"token" varchar(50) NOT NULL,
	"user_id" uuid NOT NULL UNIQUE,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"max_lifespan" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intake_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"intake_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	CONSTRAINT "intake_listings_listing_id_intake_id_unique" UNIQUE("listing_id","intake_id")
);
--> statement-breakpoint
CREATE TABLE "intakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"key" varchar(50) NOT NULL UNIQUE,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"status" "intake_status" DEFAULT 'PENDING'::"intake_status" NOT NULL,
	"doctor_remark" text
);
--> statement-breakpoint
CREATE TABLE "listing_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"listing_id" uuid NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"name" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"excerpt" text DEFAULT '',
	"metadata" jsonb,
	"body" text DEFAULT '',
	"search_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	CONSTRAINT "listing_documents_listing_id_version_unique" UNIQUE("listing_id","version")
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" varchar(50) NOT NULL,
	"brand" varchar(20) NOT NULL,
	"reviews" integer DEFAULT 0 NOT NULL,
	"product_image" varchar(255),
	"required_info" varchar[] DEFAULT '{}'::varchar[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"password" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "listing_doc_one_active_idx" ON "listing_documents" ("listing_id") WHERE "is_active" = true;--> statement-breakpoint
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_assessment_id_assessments_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id");--> statement-breakpoint
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_nvccM4gKPo6R_fkey" FOREIGN KEY ("assessment_question_id") REFERENCES "assessment_questions"("id");--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "intake_listings" ADD CONSTRAINT "intake_listings_intake_id_intakes_id_fkey" FOREIGN KEY ("intake_id") REFERENCES "intakes"("id");--> statement-breakpoint
ALTER TABLE "intake_listings" ADD CONSTRAINT "intake_listings_listing_id_listings_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id");--> statement-breakpoint
ALTER TABLE "intakes" ADD CONSTRAINT "intakes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "listing_documents" ADD CONSTRAINT "listing_documents_listing_id_listings_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id");