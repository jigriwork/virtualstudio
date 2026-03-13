-- CreateEnum
CREATE TYPE "public"."StoreType" AS ENUM ('GO_PLANET', 'BRAND_MARK');

-- CreateEnum
CREATE TYPE "public"."ProductCategory" AS ENUM ('SHIRT', 'KURTA', 'SHERWANI', 'JACKET', 'GOWN', 'DRESS', 'LEHENGA', 'DUPATTA', 'FOOTWEAR', 'ACCESSORY', 'JEWELLERY', 'BROOCH', 'PERFUME', 'BLAZER');

-- CreateEnum
CREATE TYPE "public"."RecommendationType" AS ENUM ('FOOTWEAR', 'ACCESSORY', 'JEWELLERY', 'BROOCH', 'DUPATTA', 'PERFUME');

-- CreateEnum
CREATE TYPE "public"."ReservationType" AS ENUM ('ITEM_RESERVATION', 'STORE_VISIT', 'CALL_REQUEST');

-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "public"."Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."StoreType" NOT NULL,
    "location" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" "public"."ProductCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "rackLocation" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Inventory" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GarmentAsset" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "originalImageUrl" TEXT NOT NULL,
    "processedImageUrl" TEXT NOT NULL,
    "backgroundRemoved" BOOLEAN NOT NULL DEFAULT false,
    "centered" BOOLEAN NOT NULL DEFAULT false,
    "classifiedCategory" "public"."ProductCategory" NOT NULL,
    "generatedTryOnAsset" TEXT NOT NULL,
    "processingNotes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GarmentAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reservation" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "notes" TEXT,
    "reservationType" "public"."ReservationType" NOT NULL,
    "status" "public"."ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Recommendation" (
    "id" TEXT NOT NULL,
    "baseProductId" TEXT NOT NULL,
    "recommendedProductId" TEXT NOT NULL,
    "type" "public"."RecommendationType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductAnalytics" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "tryOns" INTEGER NOT NULL DEFAULT 0,
    "reservations" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "public"."Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_storeId_productId_key" ON "public"."Inventory"("storeId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "GarmentAsset_productId_key" ON "public"."GarmentAsset"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_baseProductId_recommendedProductId_type_key" ON "public"."Recommendation"("baseProductId", "recommendedProductId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAnalytics_productId_key" ON "public"."ProductAnalytics"("productId");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GarmentAsset" ADD CONSTRAINT "GarmentAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Recommendation" ADD CONSTRAINT "Recommendation_baseProductId_fkey" FOREIGN KEY ("baseProductId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Recommendation" ADD CONSTRAINT "Recommendation_recommendedProductId_fkey" FOREIGN KEY ("recommendedProductId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductAnalytics" ADD CONSTRAINT "ProductAnalytics_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
