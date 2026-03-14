import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseRecommendationPayload } from "@/lib/validators";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const baseProductId = url.searchParams.get("baseProductId");

    const recommendations = await prisma.recommendation.findMany({
        where: baseProductId ? { baseProductId } : undefined,
        include: {
            baseProduct: true,
            recommendedProduct: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ recommendations });
}

export async function POST(request: Request) {
    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = parseRecommendationPayload(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid recommendation payload" }, { status: 400 });
    }

    if (parsed.data.baseProductId === parsed.data.recommendedProductId) {
        return NextResponse.json({ error: "Product cannot recommend itself" }, { status: 400 });
    }

    const recommendation = await prisma.recommendation.upsert({
        where: {
            baseProductId_recommendedProductId_type: {
                baseProductId: parsed.data.baseProductId,
                recommendedProductId: parsed.data.recommendedProductId,
                type: parsed.data.type,
            },
        },
        update: { score: parsed.data.score },
        create: {
            baseProductId: parsed.data.baseProductId,
            recommendedProductId: parsed.data.recommendedProductId,
            type: parsed.data.type,
            score: parsed.data.score,
        },
        include: {
            baseProduct: true,
            recommendedProduct: true,
        },
    });

    return NextResponse.json({ recommendation }, { status: 201 });
}
