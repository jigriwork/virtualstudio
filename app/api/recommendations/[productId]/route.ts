import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { customerVisibleProductWhere } from "@/lib/product-visibility";

export async function GET(_request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;

  const recommendations = await prisma.recommendation.findMany({
    where: { baseProductId: productId },
    include: { recommendedProduct: { include: { inventory: true } } },
    orderBy: { score: "desc" },
  });

  const visibilityFilter = customerVisibleProductWhere(true);

  return NextResponse.json({
    recommendations: recommendations
      .filter((entry) => {
        const stock = entry.recommendedProduct.inventory[0]?.quantity ?? 0;
        return stock > 0 || entry.recommendedProduct.isPreviewAllowedWhenOutOfStock;
      })
      .map((entry) => ({
        id: entry.id,
        type: entry.type,
        score: entry.score,
        product: entry.recommendedProduct,
      })),
    visibilityFilter,
  });
}
