import { ProductCategory } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function classifyCategory(name: string): ProductCategory {
  const lower = name.toLowerCase();
  if (lower.includes("sherwani")) return ProductCategory.SHERWANI;
  if (lower.includes("kurta")) return ProductCategory.KURTA;
  if (lower.includes("lehenga")) return ProductCategory.LEHENGA;
  if (lower.includes("dress")) return ProductCategory.DRESS;
  if (lower.includes("blazer")) return ProductCategory.BLAZER;
  if (lower.includes("dupatta")) return ProductCategory.DUPATTA;
  if (lower.includes("jacket")) return ProductCategory.JACKET;
  if (lower.includes("gown")) return ProductCategory.GOWN;
  return ProductCategory.SHIRT;
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const name = String(formData.get("name") ?? "");
  const sku = String(formData.get("sku") ?? "");
  const rackLocation = String(formData.get("rackLocation") ?? "A0");
  const price = Number(formData.get("price") ?? 0);
  const storeId = String(formData.get("storeId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const recommendationSkusRaw = String(formData.get("recommendationSkus") ?? "");
  const file = formData.get("garmentImage") as File | null;

  if (!name || !sku || !storeId || !file) {
    return NextResponse.json({ error: "name, sku, storeId and garmentImage are required" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const extension = file.name.split(".").pop() || "png";
  const filename = `${sku}.${extension}`;

  const uploadDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);

  const publicAssetUrl = `/uploads/${filename}`;
  const category = classifyCategory(name);

  const product = await prisma.product.create({
    data: {
      name,
      sku,
      category,
      description: `${name} uploaded from admin`,
      price,
      imageUrl: publicAssetUrl,
      rackLocation,
      storeId,
    },
  });

  await prisma.inventory.create({
    data: {
      storeId,
      productId: product.id,
      quantity,
    },
  });

  await prisma.garmentAsset.create({
    data: {
      productId: product.id,
      originalImageUrl: publicAssetUrl,
      processedImageUrl: publicAssetUrl,
      backgroundRemoved: true,
      centered: true,
      classifiedCategory: category,
      generatedTryOnAsset: publicAssetUrl,
      processingNotes: "Pipeline placeholder: background removed, centered, classified, asset generated",
    },
  });

  await prisma.productAnalytics.create({
    data: { productId: product.id },
  });

  const recommendationSkus = recommendationSkusRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (recommendationSkus.length > 0) {
    const recommendedProducts = await prisma.product.findMany({ where: { sku: { in: recommendationSkus } } });
    for (const target of recommendedProducts) {
      await prisma.recommendation.upsert({
        where: {
          baseProductId_recommendedProductId_type: {
            baseProductId: product.id,
            recommendedProductId: target.id,
            type: "ACCESSORY",
          },
        },
        update: {
          score: 0.8,
        },
        create: {
          baseProductId: product.id,
          recommendedProductId: target.id,
          type: "ACCESSORY",
          score: 0.8,
        },
      });
    }
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}
