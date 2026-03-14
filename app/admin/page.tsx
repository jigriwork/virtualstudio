import { ProductCategory, ProductStatus, RecommendationType } from "@prisma/client";

import { AnalyticsChart } from "@/components/analytics-chart";
import { AdminPanelClient } from "@/components/admin-panel-client";
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
  const products = await prisma.product.findMany({
    include: { inventory: true, store: true, recommendations: { include: { recommendedProduct: true } } },
    orderBy: { createdAt: "desc" },
  });
  const analytics = await getAnalyticsData();
  const lowStock = products.filter((product) => {
    const stock = product.inventory[0]?.quantity ?? 0;
    return stock > 0 && stock <= product.lowStockThreshold;
  });

  return (
    <div className="space-y-6">
      <AdminPanelClient
        initialProducts={products.map((product) => ({
          ...product,
          createdAt: product.createdAt.toISOString(),
        }))}
        stores={stores}
        categories={Object.values(ProductCategory)}
        statuses={Object.values(ProductStatus)}
        recommendationTypes={Object.values(RecommendationType)}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <AnalyticsChart title="Most Tried Outfits" data={analytics.tried} color="#f59e0b" />
        <AnalyticsChart title="Most Reserved Outfits" data={analytics.reserved} color="#22c55e" />
        <AnalyticsChart title="Most Viewed Products" data={analytics.viewed} color="#3b82f6" />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-3 text-2xl font-semibold">Low Stock Alerts</h2>
        <div className="overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-amber-200">
                <th className="p-2">SKU</th>
                <th className="p-2">Name</th>
                <th className="p-2">Store</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Threshold</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((product) => (
                <tr key={product.id} className="border-t border-white/10">
                  <td className="p-2">{product.sku}</td>
                  <td className="p-2">{product.name}</td>
                  <td className="p-2">{product.store.name}</td>
                  <td className="p-2">{product.inventory[0]?.quantity ?? 0}</td>
                  <td className="p-2">{product.lowStockThreshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
