-- ============================================================================
-- Sprint 4 — Expert-authored Knowledge Hub + Personal Assessment
-- ADDITIVE ONLY. No data is dropped or modified. Safe for production.
--
-- Apply on a Neon BRANCH first, verify, then on production
-- (Neon SQL editor or `psql "$DIRECT_URL" -f prisma/manual/sprint4_features.sql`).
-- ============================================================================

-- 1) KnowledgeContent.authorId ----------------------------------------------
ALTER TABLE "KnowledgeContent" ADD COLUMN IF NOT EXISTS "authorId" TEXT;

DO $$ BEGIN
  ALTER TABLE "KnowledgeContent"
    ADD CONSTRAINT "KnowledgeContent_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "KnowledgeContent_authorId_idx"
  ON "KnowledgeContent"("authorId");

-- 2) PersonalAssessmentStatus enum ------------------------------------------
DO $$ BEGIN
  CREATE TYPE "PersonalAssessmentStatus" AS ENUM ('DRAFT', 'SUBMITTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) PersonalAssessment table -----------------------------------------------
CREATE TABLE IF NOT EXISTS "PersonalAssessment" (
  "id"                  TEXT NOT NULL,
  "consultationId"      TEXT NOT NULL,
  "expertId"            TEXT NOT NULL,
  "assessmentId"        TEXT,
  "status"              "PersonalAssessmentStatus" NOT NULL DEFAULT 'DRAFT',
  "cognitiveStrength"   TEXT,
  "cognitiveWeakness"   TEXT,
  "cognitiveNeed"       TEXT,
  "socialStrength"      TEXT,
  "socialWeakness"      TEXT,
  "socialNeed"          TEXT,
  "psychomotorStrength" TEXT,
  "psychomotorWeakness" TEXT,
  "psychomotorNeed"     TEXT,
  "submittedAt"         TIMESTAMP(3),
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PersonalAssessment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PersonalAssessment_consultationId_key"
  ON "PersonalAssessment"("consultationId");
CREATE INDEX IF NOT EXISTS "PersonalAssessment_expertId_idx"
  ON "PersonalAssessment"("expertId");
CREATE INDEX IF NOT EXISTS "PersonalAssessment_assessmentId_idx"
  ON "PersonalAssessment"("assessmentId");

DO $$ BEGIN
  ALTER TABLE "PersonalAssessment"
    ADD CONSTRAINT "PersonalAssessment_consultationId_fkey"
    FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PersonalAssessment"
    ADD CONSTRAINT "PersonalAssessment_expertId_fkey"
    FOREIGN KEY ("expertId") REFERENCES "ExpertProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PersonalAssessment"
    ADD CONSTRAINT "PersonalAssessment_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
