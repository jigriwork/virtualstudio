import { ProductCategory } from "@prisma/client";

import { ProductCard } from "@/components/product-card";
import { StudioClient } from "@/components/studio-client";
import { prisma } from "@/lib/prisma";

export default async function StudioPage() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      inventory: {
        some: {
          quantity: {
            gt: 0,
          },
        },
      },
    },
    include: {
      inventory: true,
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
      <h1 className="text-4xl font-bold">Website Mode /studio</h1>
      <StudioClient products={mainProducts.map((p) => ({ id: p.id, name: p.name, imageUrl: p.imageUrl }))} />

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
            stock={product.inventory[0]?.quantity ?? 0}
          />
        ))}
      </section>
    </div>
  );
}
