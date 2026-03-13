import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      inventory: {
        some: {
          quantity: { gt: 0 },
        },
      },
    },
    include: {
      store: true,
      inventory: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    products: products.map((product) => ({
      ...product,
      lowStock: (product.inventory[0]?.quantity ?? 0) > 0 && (product.inventory[0]?.quantity ?? 0) <= 2,
    })),
  });
}
