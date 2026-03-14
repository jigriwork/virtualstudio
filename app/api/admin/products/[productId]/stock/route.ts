import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ productId: string }> }) {
    const { productId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
        storeId?: string;
        quantity?: number;
        lowStockThreshold?: number;
    };

    if (!body.storeId || typeof body.quantity !== "number") {
        return NextResponse.json({ error: "storeId and quantity are required" }, { status: 400 });
    }

    await prisma.inventory.upsert({
        where: {
            storeId_productId: {
                storeId: body.storeId,
                productId,
            },
        },
        update: {
            quantity: Math.max(0, Math.floor(body.quantity)),
        },
        create: {
            storeId: body.storeId,
            productId,
            quantity: Math.max(0, Math.floor(body.quantity)),
        },
    });

    if (typeof body.lowStockThreshold === "number") {
        await prisma.product.update({
            where: { id: productId },
            data: { lowStockThreshold: Math.max(0, Math.floor(body.lowStockThreshold)) },
        });
    }

    return NextResponse.json({ ok: true });
}
