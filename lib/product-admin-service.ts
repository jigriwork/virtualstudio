import { ProductCategory, ProductStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { parseProductPayload } from "@/lib/validators";
import { saveImageUpload, validateImageFile } from "@/lib/upload";

function inferCategoryFromName(name: string): ProductCategory {
    const lower = name.toLowerCase();
    if (lower.includes("sherwani")) return ProductCategory.SHERWANI;
    if (lower.includes("kurta")) return ProductCategory.KURTA;
    if (lower.includes("lehenga")) return ProductCategory.LEHENGA;
    if (lower.includes("dress")) return ProductCategory.DRESS;
    if (lower.includes("blazer")) return ProductCategory.BLAZER;
    if (lower.includes("dupatta")) return ProductCategory.DUPATTA;
    if (lower.includes("jacket")) return ProductCategory.JACKET;
    if (lower.includes("gown")) return ProductCategory.GOWN;
    if (lower.includes("perfume")) return ProductCategory.PERFUME;
    if (lower.includes("shoe") || lower.includes("footwear") || lower.includes("mojari")) return ProductCategory.FOOTWEAR;
    if (lower.includes("brooch") || lower.includes("accessory")) return ProductCategory.ACCESSORY;
    return ProductCategory.SHIRT;
}

function toBool(value: FormDataEntryValue | null, fallback = false) {
    if (typeof value !== "string") return fallback;
    return value === "true";
}

export function parseProductFormData(formData: FormData) {
    const payload = {
        name: String(formData.get("name") ?? ""),
        sku: String(formData.get("sku") ?? ""),
        category: String(formData.get("category") ?? "") || inferCategoryFromName(String(formData.get("name") ?? "")),
        description: String(formData.get("description") ?? ""),
        price: Number(formData.get("price") ?? 0),
        rackLocation: String(formData.get("rackLocation") ?? ""),
        storeId: String(formData.get("storeId") ?? ""),
        stockQuantity: Number(formData.get("stockQuantity") ?? formData.get("quantity") ?? 0),
        lowStockThreshold: Number(formData.get("lowStockThreshold") ?? 2),
        status: String(formData.get("status") ?? ProductStatus.ACTIVE),
        isActive: toBool(formData.get("isActive"), true),
        isPreviewAllowedWhenOutOfStock: toBool(formData.get("isPreviewAllowedWhenOutOfStock"), false),
    };

    return parseProductPayload(payload);
}

export async function createProductFromFormData(formData: FormData) {
    const parsed = parseProductFormData(formData);
    if (!parsed.success) {
        return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid product payload" };
    }

    const imageFile = formData.get("garmentImage") as File | null;
    if (!imageFile) {
        return { ok: false as const, error: "Product image is required" };
    }

    const imageError = validateImageFile(imageFile);
    if (imageError) {
        return { ok: false as const, error: imageError };
    }

    const { imageUrl, mimeType } = await saveImageUpload(imageFile, parsed.data.sku);

    const product = await prisma.product.create({
        data: {
            name: parsed.data.name,
            sku: parsed.data.sku,
            category: parsed.data.category,
            description: parsed.data.description,
            price: parsed.data.price,
            imageUrl,
            imageMimeType: mimeType,
            rackLocation: parsed.data.rackLocation,
            storeId: parsed.data.storeId,
            status: parsed.data.status,
            isActive: parsed.data.isActive,
            lowStockThreshold: parsed.data.lowStockThreshold,
            isPreviewAllowedWhenOutOfStock: parsed.data.isPreviewAllowedWhenOutOfStock,
        },
    });

    await prisma.inventory.upsert({
        where: {
            storeId_productId: {
                storeId: parsed.data.storeId,
                productId: product.id,
            },
        },
        update: { quantity: parsed.data.stockQuantity },
        create: {
            storeId: parsed.data.storeId,
            productId: product.id,
            quantity: parsed.data.stockQuantity,
        },
    });

    await prisma.garmentAsset.upsert({
        where: { productId: product.id },
        update: {
            originalImageUrl: imageUrl,
            processedImageUrl: imageUrl,
            generatedTryOnAsset: imageUrl,
            classifiedCategory: parsed.data.category,
            processingNotes: "Preview provider asset ready. Replace with real garment preprocessing pipeline later.",
            backgroundRemoved: false,
            centered: false,
        },
        create: {
            productId: product.id,
            originalImageUrl: imageUrl,
            processedImageUrl: imageUrl,
            generatedTryOnAsset: imageUrl,
            classifiedCategory: parsed.data.category,
            processingNotes: "Preview provider asset ready. Replace with real garment preprocessing pipeline later.",
            backgroundRemoved: false,
            centered: false,
        },
    });

    await prisma.productAnalytics.upsert({
        where: { productId: product.id },
        update: {},
        create: { productId: product.id },
    });

    const fullProduct = await prisma.product.findUnique({
        where: { id: product.id },
        include: { inventory: true, store: true, analytics: true, recommendations: true },
    });

    return { ok: true as const, product: fullProduct };
}
