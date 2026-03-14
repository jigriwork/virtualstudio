import { NextResponse } from "next/server";

import { createProductFromFormData } from "@/lib/product-admin-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const products = await prisma.product.findMany({
        include: {
            store: true,
            inventory: true,
            analytics: true,
            recommendations: {
                include: { recommendedProduct: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
}

export async function POST(request: Request) {
    const formData = await request.formData();
    const result = await createProductFromFormData(formData);

    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ product: result.product }, { status: 201 });
}
