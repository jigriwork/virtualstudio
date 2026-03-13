import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const reservations = await prisma.reservation.findMany({
    include: { product: true, store: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reservations });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    reservationType?: "ITEM_RESERVATION" | "STORE_VISIT" | "CALL_REQUEST";
    productId?: string;
    storeId?: string;
    notes?: string;
  };

  const stores = await prisma.store.findMany({ take: 1 });

  if (!body.customerName || !body.reservationType) {
    return NextResponse.json({ error: "customerName and reservationType are required" }, { status: 400 });
  }

  const fallbackStoreId = stores[0]?.id;
  const storeId = body.storeId ?? fallbackStoreId;

  if (!storeId) {
    return NextResponse.json({ error: "No store configured" }, { status: 500 });
  }

  const reservation = await prisma.reservation.create({
    data: {
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      reservationType: body.reservationType,
      productId: body.productId,
      storeId,
      notes: body.notes,
    },
  });

  if (body.productId) {
    await prisma.productAnalytics.upsert({
      where: { productId: body.productId },
      update: { reservations: { increment: 1 } },
      create: { productId: body.productId, reservations: 1 },
    });
  }

  return NextResponse.json({ reservation }, { status: 201 });
}
