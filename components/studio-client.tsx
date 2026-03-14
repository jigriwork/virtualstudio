"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";

type Product = {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
    category: string;
    storeName: string;
    storeId: string;
    stock: number;
    previewAllowedWhenOutOfStock: boolean;
};

type Recommendation = {
    id: string;
    type: string;
    product: {
        id: string;
        name: string;
        imageUrl: string;
        price: number;
        category: string;
    };
};

type ReservationForm = {
    customerName: string;
    customerPhone: string;
    storeId: string;
    notes: string;
};

export function StudioClient({ products }: { products: Product[] }) {
    const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
    const [compareProductId, setCompareProductId] = useState(products[1]?.id ?? products[0]?.id ?? "");
    const [sourceImage, setSourceImage] = useState<string>("");
    const [previewResult, setPreviewResult] = useState<string>("");
    const [previewMeta, setPreviewMeta] = useState<{ mode?: string; provider?: string; message?: string } | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loadingStyle, setLoadingStyle] = useState(false);
    const [styleResult, setStyleResult] = useState<string>("");
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [cameraRunning, setCameraRunning] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [reservationStatus, setReservationStatus] = useState<string>("");
    const [reservationLoading, setReservationLoading] = useState(false);
    const [shareStatus, setShareStatus] = useState("");

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const selectedProduct = useMemo(
        () => products.find((product) => product.id === selectedProductId) ?? products[0],
        [products, selectedProductId],
    );

    const stores = useMemo(() => {
        const unique = new Map<string, { id: string; name: string }>();
        for (const product of products) {
            unique.set(product.storeId, { id: product.storeId, name: product.storeName });
        }
        return Array.from(unique.values());
    }, [products]);

    const [reservationForm, setReservationForm] = useState<ReservationForm>({
        customerName: "",
        customerPhone: "",
        storeId: "",
        notes: "",
    });

    useEffect(() => {
        if (!selectedProductId) return;

        fetch("/api/products/view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: selectedProductId, event: "VIEW" }),
        }).catch(() => undefined);
    }, [selectedProductId]);

    useEffect(() => {
        if (!selectedProductId) return;

        fetch(`/api/recommendations/${selectedProductId}`)
            .then((response) => response.json())
            .then((data) => setRecommendations(data.recommendations ?? []))
            .catch(() => setRecommendations([]));
    }, [selectedProductId]);

    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    const onUploadFile = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setSourceImage(String(reader.result));
            setPreviewResult("");
            setPreviewMeta(null);
        };
        reader.readAsDataURL(file);
    };

    const clearSelectedImage = () => {
        setSourceImage("");
        setPreviewResult("");
        setPreviewMeta(null);
    };

    const startCamera = async () => {
        try {
            setCameraError("");
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setCameraRunning(true);
        } catch {
            setCameraRunning(false);
            setCameraError("Camera permission denied or unavailable on this browser/device.");
        }
    };

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setCameraRunning(false);
    };

    const captureFromCamera = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth || 960;
        canvas.height = videoRef.current.videoHeight || 1280;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.9);
        setSourceImage(base64);
        setPreviewResult("");
        setPreviewMeta(null);
    };

    const runPreview = async () => {
        if (!sourceImage || !selectedProductId) return;
        setLoadingPreview(true);
        setPreviewMeta(null);

        const response = await fetch("/api/tryon", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: sourceImage, productId: selectedProductId }),
        });

        const data = await response.json().catch(() => ({}));
        setLoadingPreview(false);

        if (!response.ok) {
            setPreviewMeta({ mode: "PREVIEW", provider: "error", message: data.error || "Unable to generate preview" });
            return;
        }

        setPreviewResult(data.renderedImageUrl || sourceImage);
        setPreviewMeta({
            mode: data.mode,
            provider: data.provider,
            message: data.message || "Preview generated",
        });
    };

    const runStyleScan = async () => {
        if (!sourceImage) return;
        setLoadingStyle(true);

        const response = await fetch("/api/style-scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: sourceImage }),
        });

        const data = await response.json().catch(() => ({}));
        setLoadingStyle(false);
        if (!response.ok) {
            setStyleResult(data.error || "Style scan unavailable");
            return;
        }

        setStyleResult(`${data.style} (${Math.round((data.confidence ?? 0) * 100)}%) · ${data.provider}`);
    };

    const submitReservation = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedProduct) return;

        if (!reservationForm.customerName.trim() || reservationForm.customerPhone.trim().length < 8 || !reservationForm.storeId) {
            setReservationStatus("Please provide name, valid phone, and preferred store.");
            return;
        }

        setReservationLoading(true);
        setReservationStatus("");

        const response = await fetch("/api/reservations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customerName: reservationForm.customerName,
                customerPhone: reservationForm.customerPhone,
                storeId: reservationForm.storeId || selectedProduct.storeId,
                notes: reservationForm.notes,
                reservationType: "ITEM_RESERVATION",
                productId: selectedProduct.id,
            }),
        });

        const data = await response.json().catch(() => ({}));
        setReservationLoading(false);

        if (!response.ok) {
            setReservationStatus(data.error || "Reservation failed");
            return;
        }

        setReservationStatus("Reservation submitted successfully. Store staff will contact you shortly.");
        setReservationForm((prev) => ({ ...prev, customerName: "", customerPhone: "", notes: "" }));
    };

    const shareLook = async () => {
        if (!previewResult) {
            setShareStatus("Generate a preview first to share.");
            return;
        }

        const text = `My GPBM look: ${selectedProduct?.name ?? "Look"}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: "GPBM Preview Mode Look", text, url: window.location.href });
                setShareStatus("Shared successfully.");
                return;
            } catch {
                setShareStatus("Share cancelled.");
                return;
            }
        }

        setShareStatus("Native share is unavailable. Use WhatsApp share below.");
    };

    if (products.length === 0) {
        return (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
                <h2 className="text-3xl font-semibold">Studio currently has no visible products</h2>
                <p className="mt-2 text-white/70">Please ask admin to set products to active with available stock or enable preview while out of stock.</p>
            </section>
        );
    }

    return (
        <div className="space-y-6 text-white">
            <section className="rounded-3xl border border-white/15 bg-black/25 p-6 shadow-2xl backdrop-blur">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-200">Website Mode</p>
                <h1 className="text-4xl font-semibold">Virtual Studio Preview</h1>
                <p className="mt-2 text-white/70">Result is clearly marked as Preview Mode until a real VTON provider is integrated.</p>

                <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {products.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => setSelectedProductId(product.id)}
                            className={`rounded-2xl border px-4 py-3 text-left transition ${selectedProductId === product.id ? "border-amber-300/70 bg-amber-400/10" : "border-white/15 bg-white/5 hover:bg-white/10"}`}
                        >
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-white/70">{product.storeName}</p>
                            <p className="text-xs text-white/70">₹{product.price.toLocaleString("en-IN")}</p>
                            <p className="mt-1 text-[11px] text-amber-100">Stock: {product.stock}</p>
                        </button>
                    ))}
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4 rounded-3xl border border-white/15 bg-black/20 p-5">
                    <h2 className="text-xl font-semibold">Photo Input</h2>
                    <div className="grid gap-2 md:grid-cols-2">
                        <input type="file" accept="image/*" onChange={onUploadFile} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                        <button onClick={clearSelectedImage} className="rounded-xl border border-white/20 px-3 py-2 hover:bg-white/10">
                            Remove Selected Image
                        </button>
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <button onClick={startCamera} className="rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20">
                            Start Camera
                        </button>
                        <button onClick={captureFromCamera} className="rounded-xl border border-white/20 px-3 py-2 hover:bg-white/10">
                            Capture Frame
                        </button>
                        <button onClick={stopCamera} className="rounded-xl border border-white/20 px-3 py-2 hover:bg-white/10">
                            Stop Camera
                        </button>
                    </div>

                    {cameraError && <p className="text-sm text-rose-200">{cameraError}</p>}
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-3">
                        <video ref={videoRef} autoPlay muted playsInline className="h-56 w-full rounded-xl object-cover" />
                        <p className="mt-2 text-xs text-white/60">Camera: {cameraRunning ? "Live" : "Off"}</p>
                    </div>

                    {sourceImage && (
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                            <p className="mb-2 text-sm text-white/70">Selected Input</p>
                            <img src={sourceImage} alt="Selected input" className="h-56 w-full rounded-xl object-cover" />
                        </div>
                    )}
                </div>

                <div className="space-y-4 rounded-3xl border border-white/15 bg-black/20 p-5">
                    <h2 className="text-xl font-semibold">Try-On Preview</h2>
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                        {previewResult ? <img src={previewResult} alt="Preview result" className="h-72 w-full rounded-xl object-cover" /> : <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-white/20 text-white/50">Preview result will appear here</div>}
                    </div>

                    {previewMeta && (
                        <p className="rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                            {previewMeta.mode || "PREVIEW"} · {previewMeta.provider || "preview-provider"} · {previewMeta.message}
                        </p>
                    )}

                    <div className="grid gap-2 md:grid-cols-2">
                        <button onClick={runPreview} disabled={loadingPreview || !sourceImage} className="rounded-xl bg-amber-400 px-4 py-2 font-semibold text-black disabled:opacity-60">
                            {loadingPreview ? "Generating Preview..." : "Run Preview Mode"}
                        </button>
                        <button onClick={runStyleScan} disabled={loadingStyle || !sourceImage} className="rounded-xl border border-white/20 px-4 py-2 disabled:opacity-60">
                            {loadingStyle ? "Scanning..." : "Style Scan"}
                        </button>
                    </div>

                    {styleResult && <p className="text-sm text-indigo-200">{styleResult}</p>}

                    <div className="grid gap-2 md:grid-cols-2">
                        <button onClick={shareLook} className="rounded-xl border border-white/20 px-4 py-2 hover:bg-white/10">
                            Share Look
                        </button>
                        <a
                            href={`https://wa.me/?text=${encodeURIComponent(`GPBM Preview look: ${selectedProduct?.name ?? "Look"} ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-white/20 px-4 py-2 text-center hover:bg-white/10"
                        >
                            Share on WhatsApp
                        </a>
                    </div>
                    {shareStatus && <p className="text-xs text-white/70">{shareStatus}</p>}
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3 rounded-3xl border border-white/15 bg-black/20 p-5">
                    <h3 className="text-xl font-semibold">Compare Looks</h3>
                    <div className="grid gap-2 md:grid-cols-2">
                        <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2">
                            {products.map((product) => (
                                <option key={product.id} value={product.id} className="text-black">
                                    {product.name}
                                </option>
                            ))}
                        </select>
                        <select value={compareProductId} onChange={(e) => setCompareProductId(e.target.value)} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2">
                            {products.map((product) => (
                                <option key={product.id} value={product.id} className="text-black">
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Link
                        href={compareProductId && selectedProductId ? `/compare?left=${selectedProductId}&right=${compareProductId}` : "/compare"}
                        className="inline-block rounded-xl bg-white/10 px-4 py-2 hover:bg-white/20"
                    >
                        Open Compare View
                    </Link>
                </div>

                <form onSubmit={submitReservation} className="space-y-3 rounded-3xl border border-white/15 bg-black/20 p-5">
                    <h3 className="text-xl font-semibold">Reserve Selected Item</h3>
                    <p className="text-sm text-white/70">Product: {selectedProduct?.name}</p>
                    <input
                        value={reservationForm.customerName}
                        onChange={(e) => setReservationForm((prev) => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Customer name"
                        className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2"
                    />
                    <input
                        value={reservationForm.customerPhone}
                        onChange={(e) => setReservationForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="Phone"
                        className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2"
                    />
                    <select
                        value={reservationForm.storeId || selectedProduct?.storeId || ""}
                        onChange={(e) => setReservationForm((prev) => ({ ...prev, storeId: e.target.value }))}
                        className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2"
                    >
                        {stores.map((store) => (
                            <option key={store.id} value={store.id} className="text-black">
                                {store.name}
                            </option>
                        ))}
                    </select>
                    <textarea
                        value={reservationForm.notes}
                        onChange={(e) => setReservationForm((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Optional note"
                        className="h-20 w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2"
                    />
                    <button disabled={reservationLoading} className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white disabled:opacity-60">
                        {reservationLoading ? "Submitting..." : "Reserve Now"}
                    </button>
                    {reservationStatus && <p className="text-sm text-white/75">{reservationStatus}</p>}
                </form>
            </section>

            <section className="rounded-3xl border border-white/15 bg-black/20 p-5">
                <h3 className="text-xl font-semibold">Looks Good With These Available Items</h3>
                {recommendations.length === 0 ? (
                    <p className="mt-2 text-white/70">No admin recommendations configured for this product yet.</p>
                ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        {recommendations.map((recommendation) => (
                            <article key={recommendation.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                <img src={recommendation.product.imageUrl} alt={recommendation.product.name} className="h-36 w-full rounded-xl object-cover" />
                                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-amber-200">{recommendation.type}</p>
                                <p className="font-medium">{recommendation.product.name}</p>
                                <p className="text-sm text-white/70">₹{recommendation.product.price.toLocaleString("en-IN")}</p>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
