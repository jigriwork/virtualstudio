import { KioskClient } from "@/components/kiosk-client";
import { getAppBaseUrl } from "@/lib/env";
import { customerVisibleProductWhere } from "@/lib/product-visibility";
import { prisma } from "@/lib/prisma";

export default async function KioskPage() {
  const products = await prisma.product.findMany({
    where: customerVisibleProductWhere(true),
    include: { inventory: true, store: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <KioskClient
        appBaseUrl={getAppBaseUrl()}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          rackLocation: p.rackLocation,
          imageUrl: p.imageUrl,
          storeName: p.store.name,
          storeId: p.storeId,
          price: p.price,
          stock: p.inventory[0]?.quantity ?? 0,
        }))}
      />
    </div>
  );
}
