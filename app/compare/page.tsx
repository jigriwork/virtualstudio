import Image from "next/image";

import { prisma } from "@/lib/prisma";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ left?: string; right?: string }>;
}) {
  const params = await searchParams;
  const products = await prisma.product.findMany({
    where: { inventory: { some: { quantity: { gt: 0 } } } },
    include: { inventory: true },
  });

  const left = products.find((p) => p.id === params.left) ?? products[0];
  const right = products.find((p) => p.id === params.right) ?? products[1] ?? products[0];

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Compare Looks</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {[left, right].map((product, idx) => (
          <article key={product.id + idx} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-2xl font-semibold">{product.name}</h2>
            <p className="text-white/70">Category: {product.category}</p>
            <p className="text-white/70">Rack Location: {product.rackLocation}</p>
            <div className="relative mt-3 h-80 rounded-xl bg-white/90">
              <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-4" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
