-- DropIndex
DROP INDEX "ChatRoom_id_idx";

-- DropIndex
DROP INDEX "Consultation_expertId_idx";

-- DropIndex
DROP INDEX "Consultation_parentId_idx";

-- DropIndex
DROP INDEX "Consultation_scheduledAt_idx";

-- DropIndex
DROP INDEX "ExpertProfile_isAvailable_idx";

-- DropIndex
DROP INDEX "ExpertReview_expertId_idx";

-- DropIndex
DROP INDEX "KnowledgeContent_isPremium_idx";

-- DropIndex
DROP INDEX "KnowledgeContent_slug_idx";

-- DropIndex
DROP INDEX "Payment_midtransOrderId_idx";

-- DropIndex
DROP INDEX "Payment_userId_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- DropIndex
DROP INDEX "User_isPremium_idx";

-- CreateIndex
CREATE INDEX "Consultation_parentId_scheduledAt_idx" ON "Consultation"("parentId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Consultation_expertId_scheduledAt_idx" ON "Consultation"("expertId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Consultation_parentId_status_idx" ON "Consultation"("parentId", "status");

-- CreateIndex
CREATE INDEX "ExpertProfile_isVerified_isAvailable_rating_idx" ON "ExpertProfile"("isVerified", "isAvailable", "rating");

-- CreateIndex
CREATE INDEX "ExpertReview_expertId_createdAt_idx" ON "ExpertReview"("expertId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_userId_type_createdAt_idx" ON "Payment"("userId", "type", "createdAt");
