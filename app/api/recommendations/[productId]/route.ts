import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;

  const recommendations = await prisma.recommendation.findMany({
    where: { baseProductId: productId },
    include: { recommendedProduct: { include: { inventory: true } } },
    orderBy: { score: "desc" },
  });

  return NextResponse.json({
    recommendations: recommendations
      .filter((entry) => (entry.recommendedProduct.inventory[0]?.quantity ?? 0) > 0)
      .map((entry) => ({
        id: entry.id,
        type: entry.type,
        score: entry.score,
        product: entry.recommendedProduct,
      })),
  });
}
