import { AnalyticsChart } from "@/components/analytics-chart";
import { prisma } from "@/lib/prisma";

async function getAnalyticsData() {
  const data = await prisma.productAnalytics.findMany({
    include: { product: true },
    orderBy: { updatedAt: "desc" },
  });

  return {
    tried: [...data].sort((a, b) => b.tryOns - a.tryOns).slice(0, 5).map((entry) => ({ name: entry.product.name, metric: entry.tryOns })),
    reserved: [...data]
      .sort((a, b) => b.reservations - a.reservations)
      .slice(0, 5)
      .map((entry) => ({ name: entry.product.name, metric: entry.reservations })),
    viewed: [...data].sort((a, b) => b.views - a.views).slice(0, 5).map((entry) => ({ name: entry.product.name, metric: entry.views })),
  };
}

export default async function AdminPage() {
  const stores = await prisma.store.findMany();
  const products = await prisma.product.findMany({ include: { inventory: true, store: true }, orderBy: { createdAt: "desc" } });
  const analytics = await getAnalyticsData();

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Admin Dashboard</h1>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-4 text-2xl font-semibold">Upload Garment Asset</h2>
        <form action="/api/admin/upload" method="POST" encType="multipart/form-data" className="grid gap-3 md:grid-cols-2">
          <input name="name" placeholder="Garment name" required className="rounded p-2 text-black" />
          <input name="sku" placeholder="SKU" required className="rounded p-2 text-black" />
          <input name="rackLocation" placeholder="Rack location" required className="rounded p-2 text-black" />
          <input name="price" placeholder="Price" type="number" required className="rounded p-2 text-black" />
          <select name="storeId" required className="rounded p-2 text-black">
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          <input name="quantity" placeholder="Stock quantity" type="number" required className="rounded p-2 text-black" />
          <input name="recommendationSkus" placeholder="Recommendation SKUs comma separated" className="rounded p-2 text-black md:col-span-2" />
          <input name="garmentImage" type="file" accept="image/*" required className="rounded border border-white/20 p-2" />
          <button className="rounded bg-amber-400 px-4 py-2 font-semibold text-black">Upload & Process</button>
        </form>
        <p className="mt-3 text-xs text-white/70">Pipeline: remove background → center garment → classify category → generate try-on asset → store metadata</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <AnalyticsChart title="Most Tried Outfits" data={analytics.tried} color="#f59e0b" />
        <AnalyticsChart title="Most Reserved Outfits" data={analytics.reserved} color="#22c55e" />
        <AnalyticsChart title="Most Viewed Products" data={analytics.viewed} color="#3b82f6" />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-3 text-2xl font-semibold">Inventory Snapshot</h2>
        <div className="overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-amber-200">
                <th className="p-2">SKU</th>
                <th className="p-2">Name</th>
                <th className="p-2">Store</th>
                <th className="p-2">Rack</th>
                <th className="p-2">Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-white/10">
                  <td className="p-2">{product.sku}</td>
                  <td className="p-2">{product.name}</td>
                  <td className="p-2">{product.store.name}</td>
                  <td className="p-2">{product.rackLocation}</td>
                  <td className="p-2">{product.inventory[0]?.quantity ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
