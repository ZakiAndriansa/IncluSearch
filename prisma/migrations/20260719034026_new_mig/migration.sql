-- CreateEnum
CREATE TYPE "PersonalAssessmentStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- AlterTable
ALTER TABLE "KnowledgeContent" ADD COLUMN     "authorId" TEXT;

-- CreateTable
CREATE TABLE "PersonalAssessment" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "status" "PersonalAssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "cognitiveStrength" TEXT,
    "cognitiveWeakness" TEXT,
    "cognitiveNeed" TEXT,
    "socialStrength" TEXT,
    "socialWeakness" TEXT,
    "socialNeed" TEXT,
    "psychomotorStrength" TEXT,
    "psychomotorWeakness" TEXT,
    "psychomotorNeed" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonalAssessment_consultationId_key" ON "PersonalAssessment"("consultationId");

-- CreateIndex
CREATE INDEX "PersonalAssessment_expertId_idx" ON "PersonalAssessment"("expertId");

-- CreateIndex
CREATE INDEX "PersonalAssessment_assessmentId_idx" ON "PersonalAssessment"("assessmentId");

-- CreateIndex
CREATE INDEX "KnowledgeContent_authorId_idx" ON "KnowledgeContent"("authorId");

-- AddForeignKey
ALTER TABLE "KnowledgeContent" ADD CONSTRAINT "KnowledgeContent_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalAssessment" ADD CONSTRAINT "PersonalAssessment_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalAssessment" ADD CONSTRAINT "PersonalAssessment_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "ExpertProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalAssessment" ADD CONSTRAINT "PersonalAssessment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
