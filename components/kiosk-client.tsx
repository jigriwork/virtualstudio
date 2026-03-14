"use client";

import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";

import { useInactivityReset } from "@/hooks/useInactivityReset";

type Product = {
    id: string;
    name: string;
    category: string;
    rackLocation: string;
    imageUrl: string;
    storeName: string;
    storeId: string;
    price: number;
    stock: number;
};

type Props = {
    products: Product[];
    appBaseUrl: string;
};

export function KioskClient({ products, appBaseUrl }: Props) {
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [leftProduct, setLeftProduct] = useState<string>(products[0]?.id ?? "");
    const [rightProduct, setRightProduct] = useState<string>(products[1]?.id ?? products[0]?.id ?? "");
    const [shortlist, setShortlist] = useState<string[]>([]);
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [kioskMessage, setKioskMessage] = useState("");
    const [showRackPanel, setShowRackPanel] = useState(false);
    const [cameraRunning, setCameraRunning] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [capturedImage, setCapturedImage] = useState("");

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const categories = ["ALL", ...Array.from(new Set(products.map((product) => product.category)))];

    const visibleProducts = useMemo(
        () => products.filter((product) => (selectedCategory === "ALL" ? true : product.category === selectedCategory)),
        [products, selectedCategory],
    );

    const leftSelectedProduct = products.find((product) => product.id === leftProduct);
    const rightSelectedProduct = products.find((product) => product.id === rightProduct);

    const resetAllState = () => {
        setSelectedCategory("ALL");
        setLeftProduct(products[0]?.id ?? "");
        setRightProduct(products[1]?.id ?? products[0]?.id ?? "");
        setShortlist([]);
        setQrCodeUrl("");
        setKioskMessage("Kiosk reset complete");
        setShowRackPanel(false);
        setCapturedImage("");
    };

    useInactivityReset(90_000, resetAllState);

    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setCameraError("");
            setCameraRunning(true);
        } catch {
            setCameraRunning(false);
            setCameraError("Camera unavailable on this kiosk browser/device.");
        }
    };

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setCameraRunning(false);
    };

    const captureFrame = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth || 960;
        canvas.height = videoRef.current.videoHeight || 1280;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));
    };

    const generateQr = async () => {
        if (!leftProduct || !rightProduct) {
            setKioskMessage("Select products first.");
            return;
        }

        const compareUrl = `${appBaseUrl}/compare?left=${encodeURIComponent(leftProduct)}&right=${encodeURIComponent(rightProduct)}`;
        const qr = await QRCode.toDataURL(compareUrl, { width: 340 });
        setQrCodeUrl(qr);
        setKioskMessage("QR code generated. Scan to continue on mobile.");
    };

    const callStaff = async () => {
        const storeId = leftSelectedProduct?.storeId ?? rightSelectedProduct?.storeId;
        if (!storeId) {
            setKioskMessage("Select a product first.");
            return;
        }

        const response = await fetch("/api/reservations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customerName: "Kiosk User",
                customerPhone: "0000000000",
                reservationType: "CALL_REQUEST",
                storeId,
                notes: "Staff assistance requested from kiosk",
            }),
        });

        if (!response.ok) {
            setKioskMessage("Unable to notify staff. Please try again.");
            return;
        }

        setKioskMessage("Staff has been notified.");
    };

    const addToShortlist = () => {
        const candidate = leftProduct || rightProduct;
        if (!candidate) return;
        setShortlist((prev) => (prev.includes(candidate) ? prev : [...prev, candidate]));
        setKioskMessage("Added to shortlist.");
    };

    const openRackPanel = () => {
        setShowRackPanel(true);
    };

    return (
        <div className="space-y-6 text-white">
            <section className="rounded-3xl border border-white/15 bg-black/35 p-7">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-200">Digital Mirror</p>
                <h1 className="text-5xl font-semibold">Welcome to GPBM Kiosk Mode</h1>
                <p className="mt-2 text-xl text-white/80">Tap a category to begin your showroom preview journey.</p>

                <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`rounded-2xl border px-5 py-4 text-lg font-semibold transition ${selectedCategory === category ? "border-amber-300 bg-amber-400/20" : "border-white/20 bg-white/5 hover:bg-white/10"}`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                <div className="space-y-4 rounded-3xl border border-white/15 bg-black/25 p-5">
                    <h2 className="text-2xl font-semibold">Live Mirror Camera</h2>

                    <div className="grid gap-2 md:grid-cols-3">
                        <button onClick={startCamera} className="rounded-2xl bg-white/10 px-4 py-3 text-lg hover:bg-white/20">
                            Start Camera
                        </button>
                        <button onClick={captureFrame} className="rounded-2xl border border-white/20 px-4 py-3 text-lg hover:bg-white/10">
                            Capture
                        </button>
                        <button onClick={stopCamera} className="rounded-2xl border border-white/20 px-4 py-3 text-lg hover:bg-white/10">
                            Stop
                        </button>
                    </div>

                    {cameraError && <p className="text-sm text-rose-200">{cameraError}</p>}
                    <div className="rounded-2xl border border-white/10 bg-black/50 p-3">
                        <video ref={videoRef} autoPlay playsInline muted className="h-72 w-full rounded-xl object-cover" />
                        <p className="mt-2 text-sm text-white/70">Status: {cameraRunning ? "Live" : "Not active"}</p>
                    </div>

                    {capturedImage && (
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                            <p className="mb-2 text-sm text-white/70">Captured Frame</p>
                            <img src={capturedImage} alt="Captured kiosk frame" className="h-52 w-full rounded-xl object-cover" />
                        </div>
                    )}
                </div>

                <div className="space-y-4 rounded-3xl border border-white/15 bg-black/25 p-5">
                    <h2 className="text-2xl font-semibold">Outfit Compare & Actions</h2>
                    <div className="grid gap-2 md:grid-cols-2">
                        <select value={leftProduct} onChange={(e) => setLeftProduct(e.target.value)} className="rounded-2xl border border-white/20 bg-black/35 px-3 py-3 text-lg">
                            {visibleProducts.map((product) => (
                                <option key={product.id} value={product.id} className="text-black">
                                    {product.name}
                                </option>
                            ))}
                        </select>
                        <select value={rightProduct} onChange={(e) => setRightProduct(e.target.value)} className="rounded-2xl border border-white/20 bg-black/35 px-3 py-3 text-lg">
                            {visibleProducts.map((product) => (
                                <option key={product.id} value={product.id} className="text-black">
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                        <button onClick={addToShortlist} className="rounded-2xl border border-white/20 px-4 py-4 text-lg hover:bg-white/10">
                            Shortlist Product
                        </button>
                        <button onClick={generateQr} className="rounded-2xl bg-amber-400 px-4 py-4 text-lg font-semibold text-black">
                            Generate QR
                        </button>
                        <button onClick={openRackPanel} className="rounded-2xl border border-white/20 px-4 py-4 text-lg hover:bg-white/10">
                            Show Rack Location
                        </button>
                        <button onClick={callStaff} className="rounded-2xl bg-rose-500 px-4 py-4 text-lg font-semibold text-white">
                            Call Staff
                        </button>
                        <button onClick={resetAllState} className="rounded-2xl bg-slate-700 px-4 py-4 text-lg md:col-span-2">
                            Reset Kiosk
                        </button>
                    </div>

                    {qrCodeUrl && <img src={qrCodeUrl} alt="Kiosk QR" className="h-52 w-52 rounded-2xl bg-white p-2" />}
                    <p className="text-sm text-white/80">Shortlisted items: {shortlist.length}</p>
                    {kioskMessage && <p className="text-sm text-amber-100">{kioskMessage}</p>}
                </div>
            </section>

            <section className="rounded-3xl border border-white/15 bg-black/25 p-5">
                <h3 className="mb-3 text-2xl font-semibold">Category Shelf</h3>
                {visibleProducts.length === 0 ? (
                    <p className="text-white/70">No products available in this category.</p>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        {visibleProducts.map((product) => (
                            <article key={product.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                <img src={product.imageUrl} alt={product.name} className="h-40 w-full rounded-xl object-cover" />
                                <p className="mt-2 font-medium">{product.name}</p>
                                <p className="text-sm text-white/70">{product.storeName}</p>
                                <p className="text-sm text-white/70">Stock: {product.stock}</p>
                                <p className="text-sm text-white/70">₹{product.price.toLocaleString("en-IN")}</p>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {showRackPanel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-[#100b24] p-6">
                        <h4 className="text-2xl font-semibold">Rack Location</h4>
                        {leftSelectedProduct || rightSelectedProduct ? (
                            <div className="mt-4 space-y-3">
                                {[leftSelectedProduct, rightSelectedProduct]
                                    .filter(Boolean)
                                    .map((product) => (
                                        <div key={product?.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                                            <p className="font-medium">{product?.name}</p>
                                            <p className="text-sm text-white/70">Store: {product?.storeName}</p>
                                            <p className="text-sm text-white/70">Section: {product?.category}</p>
                                            <p className="text-sm text-white/70">Rack: {product?.rackLocation}</p>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p className="mt-3 text-white/70">Select products to view rack details.</p>
                        )}
                        <button onClick={() => setShowRackPanel(false)} className="mt-5 rounded-xl border border-white/20 px-4 py-2 hover:bg-white/10">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
