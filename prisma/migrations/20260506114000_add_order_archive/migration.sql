ALTER TABLE "Order"
  ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "Order_isArchived_idx" ON "Order"("isArchived");
