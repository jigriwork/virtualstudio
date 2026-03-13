import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.productAnalytics.findMany({ include: { product: true } });

  const mostTried = [...rows].sort((a, b) => b.tryOns - a.tryOns).slice(0, 5);
  const mostReserved = [...rows].sort((a, b) => b.reservations - a.reservations).slice(0, 5);
  const mostViewed = [...rows].sort((a, b) => b.views - a.views).slice(0, 5);

  return NextResponse.json({
    mostTried,
    mostReserved,
    mostViewed,
  });
}
