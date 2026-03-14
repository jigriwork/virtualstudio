import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.productAnalytics.findMany({ include: { product: { include: { inventory: true } } } });

  const mostTried = [...rows].sort((a, b) => b.tryOns - a.tryOns).slice(0, 5);
  const mostReserved = [...rows].sort((a, b) => b.reservations - a.reservations).slice(0, 5);
  const mostViewed = [...rows].sort((a, b) => b.views - a.views).slice(0, 5);
  const lowStockAlerts = rows
    .filter((row) => {
      const qty = row.product.inventory[0]?.quantity ?? 0;
      return qty > 0 && qty <= row.product.lowStockThreshold;
    })
    .map((row) => ({
      productId: row.productId,
      name: row.product.name,
      sku: row.product.sku,
      quantity: row.product.inventory[0]?.quantity ?? 0,
      threshold: row.product.lowStockThreshold,
    }));

  return NextResponse.json({
    mostTried,
    mostReserved,
    mostViewed,
    lowStockAlerts,
  });
}
