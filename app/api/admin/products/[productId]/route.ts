import { ProductStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseProductPayload } from "@/lib/validators";
import { saveImageUpload, validateImageFile } from "@/lib/upload";

export async function GET(_request: Request, { params }: { params: Promise<{ productId: string }> }) {
    const { productId } = await params;
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            store: true,
            inventory: true,
            analytics: true,
            recommendations: { include: { recommendedProduct: true } },
        },
    });

    if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ productId: string }> }) {
    const { productId } = await params;
    const formData = await request.formData();

    const parsed = parseProductPayload({
        name: String(formData.get("name") ?? ""),
        sku: String(formData.get("sku") ?? ""),
        category: String(formData.get("category") ?? ""),
        description: String(formData.get("description") ?? ""),
        price: Number(formData.get("price") ?? 0),
        rackLocation: String(formData.get("rackLocation") ?? ""),
        storeId: String(formData.get("storeId") ?? ""),
        stockQuantity: Number(formData.get("stockQuantity") ?? 0),
        lowStockThreshold: Number(formData.get("lowStockThreshold") ?? 2),
        status: String(formData.get("status") ?? ProductStatus.ACTIVE),
        isActive: String(formData.get("isActive") ?? "false"),
        isPreviewAllowedWhenOutOfStock: String(formData.get("isPreviewAllowedWhenOutOfStock") ?? "false"),
    });

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const imageFile = formData.get("garmentImage") as File | null;
    let imageUrl: string | undefined;
    let imageMimeType: string | undefined;

    if (imageFile && imageFile.size > 0) {
        const imageError = validateImageFile(imageFile);
        if (imageError) {
            return NextResponse.json({ error: imageError }, { status: 400 });
        }

        const saved = await saveImageUpload(imageFile, parsed.data.sku);
        imageUrl = saved.imageUrl;
        imageMimeType = saved.mimeType;
    }

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await prisma.product.update({
        where: { id: productId },
        data: {
            name: parsed.data.name,
            sku: parsed.data.sku,
            category: parsed.data.category,
            description: parsed.data.description,
            price: parsed.data.price,
            rackLocation: parsed.data.rackLocation,
            storeId: parsed.data.storeId,
            status: parsed.data.status,
            isActive: parsed.data.isActive,
            lowStockThreshold: parsed.data.lowStockThreshold,
            isPreviewAllowedWhenOutOfStock: parsed.data.isPreviewAllowedWhenOutOfStock,
            imageUrl,
            imageMimeType,
        },
    });

    await prisma.inventory.upsert({
        where: {
            storeId_productId: {
                storeId: parsed.data.storeId,
                productId,
            },
        },
        update: { quantity: parsed.data.stockQuantity },
        create: {
            storeId: parsed.data.storeId,
            productId,
            quantity: parsed.data.stockQuantity,
        },
    });

    if (existing.storeId !== parsed.data.storeId) {
        await prisma.inventory.deleteMany({
            where: {
                productId,
                storeId: existing.storeId,
            },
        });
    }

    if (imageUrl) {
        await prisma.garmentAsset.upsert({
            where: { productId },
            update: {
                originalImageUrl: imageUrl,
                processedImageUrl: imageUrl,
                generatedTryOnAsset: imageUrl,
                classifiedCategory: parsed.data.category,
            },
            create: {
                productId,
                originalImageUrl: imageUrl,
                processedImageUrl: imageUrl,
                generatedTryOnAsset: imageUrl,
                classifiedCategory: parsed.data.category,
                processingNotes: "Asset updated from admin panel",
            },
        });
    }

    return NextResponse.json({ product });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ productId: string }> }) {
    const { productId } = await params;

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.$transaction([
        prisma.recommendation.deleteMany({ where: { OR: [{ baseProductId: productId }, { recommendedProductId: productId }] } }),
        prisma.reservation.updateMany({ where: { productId }, data: { productId: null } }),
        prisma.inventory.deleteMany({ where: { productId } }),
        prisma.garmentAsset.deleteMany({ where: { productId } }),
        prisma.productAnalytics.deleteMany({ where: { productId } }),
        prisma.product.delete({ where: { id: productId } }),
    ]);

    return NextResponse.json({ ok: true });
}
