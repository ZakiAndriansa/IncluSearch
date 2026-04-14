-- Add hasOnboarded to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasOnboarded" BOOLEAN NOT NULL DEFAULT false;

-- Create enums
DO $$ BEGIN
  CREATE TYPE "MoodType" AS ENUM ('VERY_HAPPY', 'HAPPY', 'NEUTRAL', 'SAD', 'VERY_SAD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "QualityLevel" AS ENUM ('VERY_GOOD', 'GOOD', 'FAIR', 'POOR', 'VERY_POOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AppetiteLevel" AS ENUM ('VERY_GOOD', 'GOOD', 'FAIR', 'POOR', 'REFUSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlanDomain" AS ENUM ('COMMUNICATION', 'BEHAVIOR', 'SOCIAL', 'ACADEMIC', 'MOTOR', 'EMOTION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('JOURNAL_REMINDER', 'ACTION_PLAN_REMINDER', 'CONSULTATION_REMINDER', 'INSIGHT_READY', 'PREMIUM_EXPIRED', 'ACHIEVEMENT', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DailyJournal
CREATE TABLE IF NOT EXISTS "DailyJournal" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "date"          TIMESTAMP(3) NOT NULL,
  "childName"     TEXT NOT NULL,
  "mood"          "MoodType" NOT NULL,
  "sleepQuality"  "QualityLevel",
  "appetiteLevel" "AppetiteLevel",
  "tantrumCount"  INTEGER NOT NULL DEFAULT 0,
  "achievements"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "challenges"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "behaviors"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "activities"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DailyJournal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DailyJournal_userId_date_childName_key" ON "DailyJournal"("userId", "date", "childName");
CREATE INDEX IF NOT EXISTS "DailyJournal_userId_idx" ON "DailyJournal"("userId");
CREATE INDEX IF NOT EXISTS "DailyJournal_date_idx" ON "DailyJournal"("date");
DO $$ BEGIN
  ALTER TABLE "DailyJournal" ADD CONSTRAINT "DailyJournal_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ActionPlan
CREATE TABLE IF NOT EXISTS "ActionPlan" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "weekNumber"   INTEGER NOT NULL,
  "startDate"    TIMESTAMP(3) NOT NULL,
  "endDate"      TIMESTAMP(3) NOT NULL,
  "domain"       "PlanDomain" NOT NULL,
  "goalText"     TEXT NOT NULL,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActionPlan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ActionPlan_userId_idx" ON "ActionPlan"("userId");
CREATE INDEX IF NOT EXISTS "ActionPlan_assessmentId_idx" ON "ActionPlan"("assessmentId");
CREATE INDEX IF NOT EXISTS "ActionPlan_userId_isActive_idx" ON "ActionPlan"("userId", "isActive");
DO $$ BEGIN
  ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ActionPlanActivity
CREATE TABLE IF NOT EXISTS "ActionPlanActivity" (
  "id"          TEXT NOT NULL,
  "planId"      TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "domain"      "PlanDomain" NOT NULL,
  "dayOfWeek"   INTEGER,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActionPlanActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ActionPlanActivity_planId_idx" ON "ActionPlanActivity"("planId");
DO $$ BEGIN
  ALTER TABLE "ActionPlanActivity" ADD CONSTRAINT "ActionPlanActivity_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "ActionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AssessmentInsight
CREATE TABLE IF NOT EXISTS "AssessmentInsight" (
  "id"               TEXT NOT NULL,
  "assessmentId"     TEXT NOT NULL,
  "summary"          TEXT NOT NULL,
  "detailedAnalysis" TEXT NOT NULL,
  "priorityIssues"   JSONB NOT NULL,
  "domainScores"     JSONB NOT NULL,
  "riskLevel"        TEXT NOT NULL,
  "recommendations"  JSONB NOT NULL,
  "strengths"        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentInsight_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentInsight_assessmentId_key" ON "AssessmentInsight"("assessmentId");
DO $$ BEGIN
  ALTER TABLE "AssessmentInsight" ADD CONSTRAINT "AssessmentInsight_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AiConversation
CREATE TABLE IF NOT EXISTS "AiConversation" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "messages"  JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AiConversation_userId_idx" ON "AiConversation"("userId");
DO $$ BEGIN
  ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification
CREATE TABLE IF NOT EXISTS "Notification" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "type"      "NotificationType" NOT NULL,
  "title"     TEXT NOT NULL,
  "message"   TEXT NOT NULL,
  "actionUrl" TEXT,
  "isRead"    BOOLEAN NOT NULL DEFAULT false,
  "readAt"    TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
