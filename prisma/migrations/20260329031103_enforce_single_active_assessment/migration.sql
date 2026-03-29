-- Partial unique index: only 1 active assessment per user allowed at DB level
CREATE UNIQUE INDEX "Assessment_userId_active_unique"
ON "Assessment" ("userId")
WHERE "isActive" = true;