import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ recommendationId: string }> }) {
    const { recommendationId } = await params;

    const existing = await prisma.recommendation.findUnique({ where: { id: recommendationId } });
    if (!existing) {
        return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    await prisma.recommendation.delete({ where: { id: recommendationId } });
    return NextResponse.json({ ok: true });
}
