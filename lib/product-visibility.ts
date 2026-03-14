import type { Prisma } from "@prisma/client";
import { ProductStatus } from "@prisma/client";

export function customerVisibleProductWhere(includeOutOfStockPreview = false): Prisma.ProductWhereInput {
    if (includeOutOfStockPreview) {
        return {
            isActive: true,
            status: ProductStatus.ACTIVE,
            OR: [
                { inventory: { some: { quantity: { gt: 0 } } } },
                { isPreviewAllowedWhenOutOfStock: true },
            ],
        };
    }

    return {
        isActive: true,
        status: ProductStatus.ACTIVE,
        inventory: {
            some: {
                quantity: { gt: 0 },
            },
        },
    };
}

export function isLowStock(quantity: number, threshold: number) {
    return quantity > 0 && quantity <= threshold;
}
