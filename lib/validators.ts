import { ProductCategory, ProductStatus, RecommendationType, ReservationType } from "@prisma/client";
import { z } from "zod";

const booleanField = z
    .union([z.boolean(), z.string()])
    .transform((value) => (typeof value === "boolean" ? value : value === "true"));

export const productPayloadSchema = z.object({
    name: z.string().trim().min(2),
    sku: z.string().trim().min(3).max(64),
    category: z.nativeEnum(ProductCategory),
    description: z.string().trim().min(4).max(1000),
    price: z.coerce.number().nonnegative(),
    rackLocation: z.string().trim().min(1).max(120),
    storeId: z.string().trim().min(1),
    stockQuantity: z.coerce.number().int().min(0),
    lowStockThreshold: z.coerce.number().int().min(0).max(999),
    status: z.nativeEnum(ProductStatus),
    isActive: booleanField,
    isPreviewAllowedWhenOutOfStock: booleanField,
});

export const recommendationPayloadSchema = z.object({
    baseProductId: z.string().trim().min(1),
    recommendedProductId: z.string().trim().min(1),
    type: z.nativeEnum(RecommendationType),
    score: z.coerce.number().min(0).max(1).default(0.8),
});

export const reservationPayloadSchema = z.object({
    customerName: z.string().trim().min(2),
    customerEmail: z.string().email().optional().or(z.literal("")),
    customerPhone: z.string().trim().min(8),
    reservationType: z.nativeEnum(ReservationType),
    productId: z.string().trim().optional(),
    storeId: z.string().trim().min(1),
    notes: z.string().trim().max(300).optional(),
});

export function parseProductPayload(payload: unknown) {
    return productPayloadSchema.safeParse(payload);
}

export function parseRecommendationPayload(payload: unknown) {
    return recommendationPayloadSchema.safeParse(payload);
}

export function parseReservationPayload(payload: unknown) {
    return reservationPayloadSchema.safeParse(payload);
}
