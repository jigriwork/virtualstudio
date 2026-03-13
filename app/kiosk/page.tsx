import { KioskClient } from "@/components/kiosk-client";
import { prisma } from "@/lib/prisma";

export default async function KioskPage() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      inventory: {
        some: {
          quantity: { gt: 0 },
        },
      },
    },
    include: { inventory: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-5xl font-bold">/kiosk — Store Mirror Mode</h1>
      <KioskClient
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          rackLocation: p.rackLocation,
          imageUrl: p.imageUrl,
        }))}
      />
    </div>
  );
}
