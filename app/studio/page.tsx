import { ProductCategory } from "@prisma/client";

import { ProductCard } from "@/components/product-card";
import { StudioClient } from "@/components/studio-client";
import { customerVisibleProductWhere } from "@/lib/product-visibility";
import { prisma } from "@/lib/prisma";

export default async function StudioPage() {
  const products = await prisma.product.findMany({
    where: customerVisibleProductWhere(true),
    include: {
      inventory: true,
      store: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const mainCategories: ProductCategory[] = [
    ProductCategory.SHERWANI,
    ProductCategory.KURTA,
    ProductCategory.BLAZER,
    ProductCategory.DRESS,
    ProductCategory.LEHENGA,
  ];

  const mainProducts = products.filter((p) => mainCategories.includes(p.category));

  return (
    <div className="space-y-6">
      <StudioClient
        products={mainProducts.map((p) => ({
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          price: p.price,
          category: p.category,
          storeName: p.store.name,
          storeId: p.storeId,
          stock: p.inventory[0]?.quantity ?? 0,
          previewAllowedWhenOutOfStock: p.isPreviewAllowedWhenOutOfStock,
        }))}
      />

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            category={product.category}
            imageUrl={product.imageUrl}
            rackLocation={product.rackLocation}
            price={product.price}
            storeName={product.store.name}
            stock={product.inventory[0]?.quantity ?? 0}
            lowStockThreshold={product.lowStockThreshold}
          />
        ))}
      </section>
    </div>
  );
}
