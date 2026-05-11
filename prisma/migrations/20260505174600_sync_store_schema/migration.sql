-- Align the database with the current Prisma schema.

ALTER TABLE "Category" ADD COLUMN "image" TEXT;

ALTER TABLE "Product"
  ADD COLUMN "compareAtPrice" DECIMAL(10,2),
  ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Order" ADD COLUMN "city" TEXT;
ALTER TABLE "Order" ADD COLUMN "address" TEXT;
ALTER TABLE "Order" ADD COLUMN "phone" TEXT;
ALTER TABLE "Order" ADD COLUMN "notes" TEXT;

UPDATE "Order"
SET
  "city" = COALESCE("city", 'Unknown'),
  "address" = COALESCE("address", 'Unknown'),
  "phone" = COALESCE("phone", 'Unknown');

ALTER TABLE "Order" ALTER COLUMN "city" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "address" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "phone" SET NOT NULL;

CREATE TABLE "CartItem" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

CREATE UNIQUE INDEX "CartItem_userId_productId_key" ON "CartItem"("userId", "productId");

CREATE INDEX "CartItem_userId_idx" ON "CartItem"("userId");

CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");

ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
