import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseReservationPayload } from "@/lib/validators";

export async function GET() {
  const reservations = await prisma.reservation.findMany({
    include: { product: true, store: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reservations });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseReservationPayload(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid reservation payload" }, { status: 400 });
  }

  const store = await prisma.store.findUnique({ where: { id: parsed.data.storeId } });
  if (!store) {
    return NextResponse.json({ error: "Selected store does not exist" }, { status: 400 });
  }

  if (parsed.data.productId) {
    const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
    if (!product) {
      return NextResponse.json({ error: "Selected product does not exist" }, { status: 400 });
    }
  }

  const reservation = await prisma.reservation.create({
    data: {
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail || undefined,
      customerPhone: parsed.data.customerPhone,
      reservationType: parsed.data.reservationType,
      productId: parsed.data.productId,
      storeId: parsed.data.storeId,
      notes: parsed.data.notes,
    },
  });

  if (parsed.data.productId) {
    await prisma.productAnalytics.upsert({
      where: { productId: parsed.data.productId },
      update: { reservations: { increment: 1 } },
      create: { productId: parsed.data.productId, reservations: 1 },
    });
  }

  return NextResponse.json({ reservation }, { status: 201 });
}
