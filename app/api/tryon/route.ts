import { NextResponse } from "next/server";

import { runVirtualTryOnPipeline } from "@/ai/virtual-tryon";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = (await request.json()) as { imageBase64?: string; productId?: string };

  if (!body.imageBase64 || !body.productId) {
    return NextResponse.json({ error: "imageBase64 and productId are required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: body.productId }, include: { inventory: true } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const stock = product.inventory[0]?.quantity ?? 0;
  if (stock <= 0 && !product.isPreviewAllowedWhenOutOfStock) {
    return NextResponse.json({ error: "This item is currently out of stock for preview" }, { status: 400 });
  }

  const result = await runVirtualTryOnPipeline(body.imageBase64, product.imageUrl);

  await prisma.productAnalytics.upsert({
    where: { productId: product.id },
    update: { tryOns: { increment: 1 } },
    create: { productId: product.id, tryOns: 1 },
  });

  return NextResponse.json({
    ...result,
    message: "Preview Mode result generated",
  });
}
