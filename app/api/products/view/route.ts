import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type EventType = "VIEW" | "TRY_ON" | "RESERVATION";

export async function POST(request: Request) {
  const body = (await request.json()) as { productId?: string; event?: EventType };

  if (!body.productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const event = body.event ?? "VIEW";

  const existing = await prisma.productAnalytics.findUnique({ where: { productId: body.productId } });

  if (!existing) {
    await prisma.productAnalytics.create({ data: { productId: body.productId, views: event === "VIEW" ? 1 : 0, tryOns: event === "TRY_ON" ? 1 : 0, reservations: event === "RESERVATION" ? 1 : 0 } });
  } else {
    await prisma.productAnalytics.update({
      where: { productId: body.productId },
      data: {
        views: event === "VIEW" ? { increment: 1 } : undefined,
        tryOns: event === "TRY_ON" ? { increment: 1 } : undefined,
        reservations: event === "RESERVATION" ? { increment: 1 } : undefined,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
