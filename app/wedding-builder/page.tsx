import { ProductCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const roleCategoryMap: Record<string, ProductCategory[]> = {
  Groom: [ProductCategory.SHERWANI, ProductCategory.KURTA, ProductCategory.BLAZER],
  Bride: [ProductCategory.LEHENGA, ProductCategory.DRESS, ProductCategory.GOWN],
  Brother: [ProductCategory.KURTA, ProductCategory.BLAZER],
  Friend: [ProductCategory.KURTA, ProductCategory.DRESS],
  Bridesmaid: [ProductCategory.DRESS, ProductCategory.LEHENGA],
};

const events = ["Haldi", "Mehendi", "Cocktail", "Wedding", "Reception"];

export default async function WeddingBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; event?: string }>;
}) {
  const params = await searchParams;
  const role = params.role ?? "Groom";
  const event = params.event ?? "Wedding";

  const categories = roleCategoryMap[role] ?? roleCategoryMap.Groom;

  const products = await prisma.product.findMany({
    where: {
      category: { in: categories },
      inventory: { some: { quantity: { gt: 0 } } },
    },
    include: { inventory: true },
    take: 6,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Build Your Wedding Look</h1>
      <form className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-3" method="GET">
        <select name="role" defaultValue={role} className="rounded p-2 text-black">
          {Object.keys(roleCategoryMap).map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select name="event" defaultValue={event} className="rounded p-2 text-black">
          {events.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
        <button className="rounded bg-amber-400 px-4 py-2 font-semibold text-black">Get Recommendations</button>
      </form>

      <p className="text-white/75">
        Recommended combinations for <span className="font-semibold text-amber-200">{role}</span> — <span className="font-semibold text-amber-200">{event}</span>
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="rounded-xl border border-white/10 bg-[#1a1433] p-4">
            <h3 className="text-xl font-semibold">{product.name}</h3>
            <p className="text-sm text-white/70">{product.category}</p>
            <p className="text-sm text-white/70">Rack: {product.rackLocation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
