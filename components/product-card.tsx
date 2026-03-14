import Image from "next/image";

type ProductCardProps = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  rackLocation: string;
  price: number;
  stock: number;
  storeName: string;
  lowStockThreshold: number;
};

export function ProductCard({ name, category, imageUrl, rackLocation, price, stock, storeName, lowStockThreshold }: ProductCardProps) {
  const lowStock = stock > 0 && stock <= lowStockThreshold;

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-white shadow-xl backdrop-blur">
      <div className="relative h-64 w-full bg-white/90">
        <Image src={imageUrl} alt={name} fill className="object-contain p-4" />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-200">{category}</p>
          <span className="rounded-full border border-white/20 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/80">{storeName}</span>
        </div>
        <h3 className="text-xl font-semibold">{name}</h3>
        <p className="text-sm text-white/80">Rack: {rackLocation}</p>
        <p className="text-sm text-white/80">₹{price.toLocaleString("en-IN")}</p>
        <p className="text-sm text-white/80">Stock: {stock}</p>
        {lowStock && <p className="rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-200">Low stock warning</p>}
      </div>
    </article>
  );
}
