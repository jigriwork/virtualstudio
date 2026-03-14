import { NextResponse } from "next/server";

import { customerVisibleProductWhere, isLowStock } from "@/lib/product-visibility";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const includeOutOfStockPreview = false;
  const products = await prisma.product.findMany({
    where: customerVisibleProductWhere(includeOutOfStockPreview),
    include: {
      store: true,
      inventory: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    products: products.map((product) => ({
      ...product,
      stockQuantity: product.inventory[0]?.quantity ?? 0,
      lowStock: isLowStock(product.inventory[0]?.quantity ?? 0, product.lowStockThreshold),
    })),
  });
}
