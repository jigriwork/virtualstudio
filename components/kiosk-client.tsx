"use client";

import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

import { useInactivityReset } from "@/hooks/useInactivityReset";

type Product = {
  id: string;
  name: string;
  category: string;
  rackLocation: string;
  imageUrl: string;
};

export function KioskClient({ products }: { products: Product[] }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [leftProduct, setLeftProduct] = useState<string>(products[0]?.id ?? "");
  const [rightProduct, setRightProduct] = useState<string>(products[1]?.id ?? products[0]?.id ?? "");
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    setCameraActive(Boolean(navigator.mediaDevices?.getUserMedia));
  }, []);

  const reset = () => {
    setSelectedCategory("ALL");
    setShortlist([]);
  };

  useInactivityReset(60_000, reset);

  const visibleProducts = useMemo(
    () => products.filter((p) => (selectedCategory === "ALL" ? true : p.category === selectedCategory)),
    [products, selectedCategory],
  );

  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category)))];

  const generateQr = async () => {
    const url = await QRCode.toDataURL(`https://localhost:3000/compare?left=${leftProduct}&right=${rightProduct}`);
    setQrCodeUrl(url);
  };

  return (
    <div className="space-y-6 text-white">
      <section className="rounded-3xl border border-white/20 bg-white/10 p-6">
        <h2 className="text-3xl font-bold">Store Mirror Mode</h2>
        <p className="text-lg text-white/80">Camera status: {cameraActive ? "Auto-activated" : "Unavailable (placeholder mode)"}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className="rounded-2xl border border-white/20 bg-black/30 px-6 py-5 text-xl font-semibold hover:bg-amber-500/30"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/20 bg-white/10 p-5">
          <h3 className="mb-3 text-2xl font-semibold">Compare Outfits</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <select value={leftProduct} onChange={(e) => setLeftProduct(e.target.value)} className="rounded p-3 text-black">
              {visibleProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select value={rightProduct} onChange={(e) => setRightProduct(e.target.value)} className="rounded p-3 text-black">
              {visibleProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button onClick={generateQr} className="mt-3 rounded-2xl bg-amber-400 px-6 py-4 text-xl font-semibold text-black">
            Generate QR to Download Look
          </button>
          {qrCodeUrl && <img src={qrCodeUrl} alt="QR code" className="mt-3 h-40 w-40 rounded bg-white p-2" />}
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/10 p-5">
          <h3 className="mb-3 text-2xl font-semibold">Quick Actions</h3>
          <div className="grid gap-3">
            <button
              onClick={() => {
                const active = leftProduct || rightProduct;
                if (active) setShortlist((prev) => (prev.includes(active) ? prev : [...prev, active]));
              }}
              className="rounded-2xl border border-white/20 px-6 py-4 text-xl"
            >
              Shortlist Outfit
            </button>
            <button className="rounded-2xl border border-white/20 px-6 py-4 text-xl">Show Rack Location</button>
            <button
              onClick={() =>
                fetch("/api/reservations", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ customerName: "Kiosk User", reservationType: "CALL_REQUEST" }),
                }).then(() => alert("Staff has been notified"))
              }
              className="rounded-2xl bg-rose-500 px-6 py-4 text-xl font-semibold"
            >
              Call Staff
            </button>
            <button onClick={reset} className="rounded-2xl bg-slate-700 px-6 py-4 text-xl">
              Reset Kiosk
            </button>
          </div>
          <p className="mt-4 text-white/80">Shortlisted: {shortlist.length}</p>
        </div>
      </section>
    </div>
  );
}
