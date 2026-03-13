"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

type Product = {
  id: string;
  name: string;
  imageUrl: string;
};

export function StudioClient({ products }: { products: Product[] }) {
  const [imageBase64, setImageBase64] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id ?? "");
  const [renderedResult, setRenderedResult] = useState<string>("");
  const [styleResult, setStyleResult] = useState<string>("");
  const [favourites, setFavourites] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Array<{ id: string; type: string; product: { name: string } }>>([]);
  const [webcamActive, setWebcamActive] = useState(false);

  const selected = useMemo(() => products.find((p) => p.id === selectedProductId), [products, selectedProductId]);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!selectedProductId) return;
      const response = await fetch(`/api/recommendations/${selectedProductId}`);
      const data = await response.json();
      setRecommendations(data.recommendations ?? []);
    };

    loadRecommendations();
  }, [selectedProductId]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const runTryOn = async () => {
    if (!imageBase64 || !selectedProductId) return;

    const response = await fetch("/api/tryon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, productId: selectedProductId }),
    });

    const data = await response.json();
    setRenderedResult(data.renderedImageUrl || imageBase64);

    await fetch("/api/products/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: selectedProductId, event: "TRY_ON" }),
    });
  };

  const scanStyle = async () => {
    const response = await fetch("/api/style-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    });

    const data = await response.json();
    setStyleResult(`${data.style} (${Math.round((data.confidence ?? 0) * 100)}%)`);
  };

  const reserveCurrent = async () => {
    if (!selectedProductId) return;

    await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Studio Customer",
        customerPhone: "+91-99999-99999",
        reservationType: "ITEM_RESERVATION",
        productId: selectedProductId,
      }),
    });

    await fetch("/api/products/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: selectedProductId, event: "RESERVATION" }),
    });

    alert("Item reserved successfully");
  };

  const activateWebcamPlaceholder = async () => {
    try {
      await navigator.mediaDevices?.getUserMedia?.({ video: true });
      setWebcamActive(true);
    } catch {
      setWebcamActive(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
        <h2 className="mb-3 text-xl font-semibold">Website Mode Actions</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input type="file" accept="image/*" onChange={handleUpload} className="rounded border border-white/20 p-2" />
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="rounded border border-white/20 bg-transparent p-2"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id} className="text-black">
                {product.name}
              </option>
            ))}
          </select>
          <button onClick={runTryOn} className="rounded bg-amber-400 px-4 py-2 font-semibold text-black">
            Try Outfit
          </button>
          <button onClick={activateWebcamPlaceholder} className="rounded border border-white/20 px-4 py-2">
            Use Live Webcam
          </button>
          <button onClick={scanStyle} className="rounded bg-indigo-500 px-4 py-2 font-semibold text-white">
            Style Scanner
          </button>
          <button
            onClick={() => selected && setFavourites((prev) => (prev.includes(selected.id) ? prev : [...prev, selected.id]))}
            className="rounded border border-white/20 px-4 py-2"
          >
            Save Favourite
          </button>
          <button
            onClick={() => navigator.share?.({ title: "My Look", url: window.location.href })}
            className="rounded border border-white/20 px-4 py-2"
          >
            Share Look
          </button>
          <button onClick={reserveCurrent} className="rounded bg-emerald-500 px-4 py-2 font-semibold text-white">
            Reserve Item
          </button>
          <button
            onClick={() =>
              fetch("/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customerName: "Studio Customer", reservationType: "STORE_VISIT" }),
              }).then(() => alert("Store visit booked"))
            }
            className="rounded border border-white/20 px-4 py-2"
          >
            Book Store Visit
          </button>
          <button
            onClick={() =>
              fetch("/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customerName: "Studio Customer", reservationType: "CALL_REQUEST" }),
              }).then(() => alert("Store will call you"))
            }
            className="rounded border border-white/20 px-4 py-2"
          >
            Ask Family Opinion
          </button>
        </div>
      </section>

      {(imageBase64 || renderedResult) && (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-white">
            <h3 className="mb-2 font-semibold">Input Selfie</h3>
            <img src={imageBase64} alt="Selfie" className="h-72 w-full rounded object-cover" />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-white">
            <h3 className="mb-2 font-semibold">Try-On Result</h3>
            <img src={renderedResult || imageBase64} alt="Try-on result" className="h-72 w-full rounded object-cover" />
          </div>
        </section>
      )}

      {styleResult && <p className="text-amber-200">Detected Style: {styleResult}</p>}
      <p className="text-sm text-white/70">Webcam: {webcamActive ? "Activated" : "Not active"}</p>
      <p className="text-sm text-white/70">Favourites saved: {favourites.length}</p>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="mb-2 text-lg font-semibold">Complete The Look Recommendations</h3>
        <div className="space-y-2 text-sm text-white/80">
          {recommendations.length === 0 ? (
            <p>No recommendations available for this outfit yet.</p>
          ) : (
            recommendations.map((entry) => (
              <p key={entry.id}>
                {entry.type}: <span className="text-amber-200">{entry.product.name}</span>
              </p>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
