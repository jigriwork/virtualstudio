"use client";

import { useMemo, useState } from "react";

type Store = { id: string; name: string; type: string; location: string };

type Recommendation = {
    id: string;
    type: string;
    score: number;
    recommendedProductId: string;
    recommendedProduct: { id: string; name: string; sku: string };
};

type Product = {
    id: string;
    name: string;
    sku: string;
    category: string;
    description: string;
    price: number;
    imageUrl: string;
    rackLocation: string;
    isActive: boolean;
    status: string;
    lowStockThreshold: number;
    isPreviewAllowedWhenOutOfStock: boolean;
    storeId: string;
    store: { id: string; name: string };
    inventory: Array<{ quantity: number; storeId: string }>;
    recommendations: Recommendation[];
    createdAt: string;
};

type Props = {
    initialProducts: Product[];
    stores: Store[];
    categories: string[];
    statuses: string[];
    recommendationTypes: string[];
};

type Message = { type: "success" | "error"; text: string } | null;

const defaultForm = {
    name: "",
    sku: "",
    category: "",
    description: "",
    price: "",
    rackLocation: "",
    storeId: "",
    stockQuantity: "0",
    lowStockThreshold: "2",
    status: "ACTIVE",
    isActive: true,
    isPreviewAllowedWhenOutOfStock: false,
};

export function AdminPanelClient({ initialProducts, stores, categories, statuses, recommendationTypes }: Props) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [selectedProductId, setSelectedProductId] = useState<string>(initialProducts[0]?.id ?? "");
    const [creating, setCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<Message>(null);
    const [createForm, setCreateForm] = useState(defaultForm);
    const [createImage, setCreateImage] = useState<File | null>(null);
    const [editImage, setEditImage] = useState<File | null>(null);

    const selectedProduct = useMemo(
        () => products.find((product) => product.id === selectedProductId) ?? products[0],
        [products, selectedProductId],
    );

    const [editForm, setEditForm] = useState(() => {
        if (!initialProducts[0]) return { ...defaultForm };
        const first = initialProducts[0];
        return {
            name: first.name,
            sku: first.sku,
            category: first.category,
            description: first.description,
            price: String(first.price),
            rackLocation: first.rackLocation,
            storeId: first.storeId,
            stockQuantity: String(first.inventory[0]?.quantity ?? 0),
            lowStockThreshold: String(first.lowStockThreshold),
            status: first.status,
            isActive: first.isActive,
            isPreviewAllowedWhenOutOfStock: first.isPreviewAllowedWhenOutOfStock,
        };
    });

    const [recommendationType, setRecommendationType] = useState(recommendationTypes[0] ?? "ACCESSORY");
    const [recommendedProductId, setRecommendedProductId] = useState("");

    const lowStockCount = useMemo(
        () =>
            products.filter((item) => {
                const stock = item.inventory[0]?.quantity ?? 0;
                return stock > 0 && stock <= item.lowStockThreshold;
            }).length,
        [products],
    );

    const refreshProducts = async (keepSelection = true) => {
        const response = await fetch("/api/admin/products", { cache: "no-store" });
        const data = await response.json();
        const fresh: Product[] = data.products ?? [];
        setProducts(fresh);

        if (!keepSelection) {
            setSelectedProductId(fresh[0]?.id ?? "");
            return;
        }

        if (fresh.every((item) => item.id !== selectedProductId)) {
            setSelectedProductId(fresh[0]?.id ?? "");
        }
    };

    const syncEditForm = (product: Product) => {
        setEditForm({
            name: product.name,
            sku: product.sku,
            category: product.category,
            description: product.description,
            price: String(product.price),
            rackLocation: product.rackLocation,
            storeId: product.storeId,
            stockQuantity: String(product.inventory[0]?.quantity ?? 0),
            lowStockThreshold: String(product.lowStockThreshold),
            status: product.status,
            isActive: product.isActive,
            isPreviewAllowedWhenOutOfStock: product.isPreviewAllowedWhenOutOfStock,
        });
    };

    const handleSelectProduct = (productId: string) => {
        setSelectedProductId(productId);
        const product = products.find((item) => item.id === productId);
        if (product) {
            syncEditForm(product);
        }
    };

    const buildFormData = (source: typeof createForm | typeof editForm, image: File | null) => {
        const data = new FormData();
        data.set("name", source.name);
        data.set("sku", source.sku);
        data.set("category", source.category);
        data.set("description", source.description);
        data.set("price", source.price);
        data.set("rackLocation", source.rackLocation);
        data.set("storeId", source.storeId);
        data.set("stockQuantity", source.stockQuantity);
        data.set("lowStockThreshold", source.lowStockThreshold);
        data.set("status", source.status);
        data.set("isActive", String(source.isActive));
        data.set("isPreviewAllowedWhenOutOfStock", String(source.isPreviewAllowedWhenOutOfStock));
        if (image) data.set("garmentImage", image);
        return data;
    };

    const handleCreateProduct = async () => {
        setCreating(true);
        setMessage(null);

        const response = await fetch("/api/admin/products", {
            method: "POST",
            body: buildFormData(createForm, createImage),
        });

        const data = await response.json().catch(() => ({}));
        setCreating(false);

        if (!response.ok) {
            setMessage({ type: "error", text: data.error || "Product create failed" });
            return;
        }

        setMessage({ type: "success", text: "Product uploaded successfully" });
        setCreateForm(defaultForm);
        setCreateImage(null);
        await refreshProducts(false);
    };

    const handleUpdateProduct = async () => {
        if (!selectedProduct) return;
        setSaving(true);
        setMessage(null);

        const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
            method: "PATCH",
            body: buildFormData(editForm, editImage),
        });

        const data = await response.json().catch(() => ({}));
        setSaving(false);
        setEditImage(null);

        if (!response.ok) {
            setMessage({ type: "error", text: data.error || "Product update failed" });
            return;
        }

        setMessage({ type: "success", text: "Product updated" });
        await refreshProducts(true);
    };

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;
        const confirmed = window.confirm(`Delete ${selectedProduct.name}? This cannot be undone.`);
        if (!confirmed) return;

        const response = await fetch(`/api/admin/products/${selectedProduct.id}`, { method: "DELETE" });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            setMessage({ type: "error", text: data.error || "Delete failed" });
            return;
        }

        setMessage({ type: "success", text: "Product deleted" });
        await refreshProducts(false);
    };

    const handleToggleVisibility = async () => {
        if (!selectedProduct) return;
        const nextStatus = selectedProduct.status === "HIDDEN" ? "ACTIVE" : "HIDDEN";

        const data = buildFormData(
            {
                ...editForm,
                status: nextStatus,
            },
            null,
        );

        const response = await fetch(`/api/admin/products/${selectedProduct.id}`, { method: "PATCH", body: data });
        if (!response.ok) {
            setMessage({ type: "error", text: "Failed to change visibility" });
            return;
        }

        setMessage({ type: "success", text: nextStatus === "HIDDEN" ? "Product hidden" : "Product unhidden" });
        await refreshProducts(true);
    };

    const handleQuickStockUpdate = async () => {
        if (!selectedProduct) return;
        const response = await fetch(`/api/admin/products/${selectedProduct.id}/stock`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                storeId: editForm.storeId,
                quantity: Number(editForm.stockQuantity),
                lowStockThreshold: Number(editForm.lowStockThreshold),
            }),
        });

        if (!response.ok) {
            setMessage({ type: "error", text: "Stock update failed" });
            return;
        }

        setMessage({ type: "success", text: "Stock updated" });
        await refreshProducts(true);
    };

    const handleAddRecommendation = async () => {
        if (!selectedProduct || !recommendedProductId) return;

        const response = await fetch("/api/admin/recommendations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                baseProductId: selectedProduct.id,
                recommendedProductId,
                type: recommendationType,
                score: 0.8,
            }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setMessage({ type: "error", text: data.error || "Failed to add recommendation" });
            return;
        }

        setMessage({ type: "success", text: "Recommendation added" });
        await refreshProducts(true);
    };

    const handleDeleteRecommendation = async (id: string) => {
        const response = await fetch(`/api/admin/recommendations/${id}`, { method: "DELETE" });
        if (!response.ok) {
            setMessage({ type: "error", text: "Failed to remove recommendation" });
            return;
        }

        setMessage({ type: "success", text: "Recommendation removed" });
        await refreshProducts(true);
    };

    const adminLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.href = "/admin/login";
    };

    return (
        <div className="space-y-6 text-white">
            <section className="rounded-3xl border border-white/15 bg-black/30 p-6 backdrop-blur">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-amber-200">Admin Control Center</p>
                        <h1 className="text-4xl font-semibold">Products & Inventory</h1>
                        <p className="mt-2 text-sm text-white/70">Total products: {products.length} · Low stock alerts: {lowStockCount}</p>
                    </div>
                    <button onClick={adminLogout} className="rounded-xl border border-white/30 px-4 py-2 text-sm hover:bg-white/10">
                        Logout
                    </button>
                </div>
                {message && (
                    <p
                        className={`mt-4 rounded-xl px-4 py-3 text-sm ${message.type === "success" ? "border border-emerald-300/30 bg-emerald-500/10 text-emerald-200" : "border border-rose-300/30 bg-rose-500/10 text-rose-200"
                            }`}
                    >
                        {message.text}
                    </p>
                )}
            </section>

            <section className="rounded-3xl border border-white/15 bg-black/20 p-6">
                <h2 className="mb-4 text-2xl font-semibold">Upload New Product</h2>
                <div className="grid gap-3 md:grid-cols-4">
                    <input placeholder="Name" value={createForm.name} onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                    <input placeholder="SKU" value={createForm.sku} onChange={(e) => setCreateForm((prev) => ({ ...prev, sku: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                    <select value={createForm.category} onChange={(e) => setCreateForm((prev) => ({ ...prev, category: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2">
                        <option value="">Category</option>
                        {categories.map((category) => (
                            <option key={category} value={category} className="text-black">
                                {category}
                            </option>
                        ))}
                    </select>
                    <select value={createForm.storeId} onChange={(e) => setCreateForm((prev) => ({ ...prev, storeId: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2">
                        <option value="">Store</option>
                        {stores.map((store) => (
                            <option key={store.id} value={store.id} className="text-black">
                                {store.name}
                            </option>
                        ))}
                    </select>
                    <input placeholder="Price" type="number" value={createForm.price} onChange={(e) => setCreateForm((prev) => ({ ...prev, price: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                    <input placeholder="Rack Location" value={createForm.rackLocation} onChange={(e) => setCreateForm((prev) => ({ ...prev, rackLocation: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                    <input placeholder="Stock Quantity" type="number" value={createForm.stockQuantity} onChange={(e) => setCreateForm((prev) => ({ ...prev, stockQuantity: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                    <input placeholder="Low Stock Threshold" type="number" value={createForm.lowStockThreshold} onChange={(e) => setCreateForm((prev) => ({ ...prev, lowStockThreshold: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                    <select value={createForm.status} onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2">
                        {statuses.map((status) => (
                            <option key={status} value={status} className="text-black">
                                {status}
                            </option>
                        ))}
                    </select>
                    <label className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm">
                        <input type="checkbox" checked={createForm.isActive} onChange={(e) => setCreateForm((prev) => ({ ...prev, isActive: e.target.checked }))} /> Active
                    </label>
                    <label className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm">
                        <input type="checkbox" checked={createForm.isPreviewAllowedWhenOutOfStock} onChange={(e) => setCreateForm((prev) => ({ ...prev, isPreviewAllowedWhenOutOfStock: e.target.checked }))} />
                        Allow Preview if OOS
                    </label>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setCreateImage(e.target.files?.[0] ?? null)} className="rounded-xl border border-white/20 px-3 py-2" />
                </div>
                {createImage && <p className="mt-2 text-sm text-white/70">Selected image: {createImage.name}</p>}
                <textarea placeholder="Description" value={createForm.description} onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))} className="mt-3 h-24 w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                <button onClick={handleCreateProduct} disabled={creating} className="mt-4 rounded-xl bg-amber-400 px-4 py-2 font-semibold text-black disabled:opacity-60">
                    {creating ? "Uploading..." : "Upload Product"}
                </button>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
                <div className="overflow-auto rounded-3xl border border-white/15 bg-black/20 p-4">
                    <table className="w-full min-w-[1050px] text-left text-sm">
                        <thead>
                            <tr className="text-amber-200">
                                <th className="p-2">Image</th>
                                <th className="p-2">Name</th>
                                <th className="p-2">SKU</th>
                                <th className="p-2">Store</th>
                                <th className="p-2">Category</th>
                                <th className="p-2">Stock</th>
                                <th className="p-2">Rack</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Low Stock</th>
                                <th className="p-2">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => {
                                const stock = product.inventory[0]?.quantity ?? 0;
                                const lowStock = stock > 0 && stock <= product.lowStockThreshold;
                                return (
                                    <tr
                                        key={product.id}
                                        onClick={() => handleSelectProduct(product.id)}
                                        className={`cursor-pointer border-t border-white/10 ${selectedProduct?.id === product.id ? "bg-white/10" : "hover:bg-white/5"}`}
                                    >
                                        <td className="p-2">
                                            <img src={product.imageUrl} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                                        </td>
                                        <td className="p-2">{product.name}</td>
                                        <td className="p-2">{product.sku}</td>
                                        <td className="p-2">{product.store.name}</td>
                                        <td className="p-2">{product.category}</td>
                                        <td className="p-2">{stock}</td>
                                        <td className="p-2">{product.rackLocation}</td>
                                        <td className="p-2">{product.status}</td>
                                        <td className="p-2">{lowStock ? <span className="rounded bg-amber-400/25 px-2 py-1 text-xs text-amber-200">Low</span> : "—"}</td>
                                        <td className="p-2">{new Date(product.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-4 rounded-3xl border border-white/15 bg-black/20 p-4">
                    {!selectedProduct ? (
                        <p className="text-white/70">Select a product to view and edit.</p>
                    ) : (
                        <>
                            <h3 className="text-2xl font-semibold">Edit Product</h3>
                            <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-48 w-full rounded-xl object-contain bg-white/90" />
                            <div className="grid gap-3 md:grid-cols-2">
                                <input value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                                <input value={editForm.sku} onChange={(e) => setEditForm((prev) => ({ ...prev, sku: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                                <select value={editForm.category} onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2">
                                    {categories.map((category) => (
                                        <option key={category} value={category} className="text-black">
                                            {category}
                                        </option>
                                    ))}
                                </select>
                                <select value={editForm.storeId} onChange={(e) => setEditForm((prev) => ({ ...prev, storeId: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2">
                                    {stores.map((store) => (
                                        <option key={store.id} value={store.id} className="text-black">
                                            {store.name}
                                        </option>
                                    ))}
                                </select>
                                <input type="number" value={editForm.price} onChange={(e) => setEditForm((prev) => ({ ...prev, price: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                                <input value={editForm.rackLocation} onChange={(e) => setEditForm((prev) => ({ ...prev, rackLocation: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                                <input type="number" value={editForm.stockQuantity} onChange={(e) => setEditForm((prev) => ({ ...prev, stockQuantity: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                                <input type="number" value={editForm.lowStockThreshold} onChange={(e) => setEditForm((prev) => ({ ...prev, lowStockThreshold: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                                <select value={editForm.status} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2">
                                    {statuses.map((status) => (
                                        <option key={status} value={status} className="text-black">
                                            {status}
                                        </option>
                                    ))}
                                </select>
                                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setEditImage(e.target.files?.[0] ?? null)} className="rounded-xl border border-white/20 px-3 py-2" />
                            </div>
                            <textarea value={editForm.description} onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))} className="h-24 w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
                            <div className="grid gap-2 md:grid-cols-2">
                                <label className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm">
                                    <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))} /> Active
                                </label>
                                <label className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={editForm.isPreviewAllowedWhenOutOfStock}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, isPreviewAllowedWhenOutOfStock: e.target.checked }))}
                                    />
                                    Allow Preview if OOS
                                </label>
                            </div>

                            <div className="grid gap-2 md:grid-cols-2">
                                <button onClick={handleUpdateProduct} disabled={saving} className="rounded-xl bg-amber-400 px-4 py-2 font-semibold text-black disabled:opacity-60">
                                    {saving ? "Saving..." : "Save Product"}
                                </button>
                                <button onClick={handleQuickStockUpdate} className="rounded-xl border border-white/30 px-4 py-2 hover:bg-white/10">
                                    Update Stock Only
                                </button>
                                <button onClick={handleToggleVisibility} className="rounded-xl border border-white/30 px-4 py-2 hover:bg-white/10">
                                    {selectedProduct.status === "HIDDEN" ? "Unhide" : "Hide"} Product
                                </button>
                                <button onClick={handleDeleteProduct} className="rounded-xl bg-rose-500 px-4 py-2 font-semibold text-white hover:bg-rose-400">
                                    Delete Product
                                </button>
                            </div>

                            <div className="rounded-2xl border border-white/15 p-3">
                                <h4 className="text-lg font-semibold">Recommendations</h4>
                                <div className="mt-2 grid gap-2 md:grid-cols-2">
                                    <select value={recommendedProductId} onChange={(e) => setRecommendedProductId(e.target.value)} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2">
                                        <option value="">Select product</option>
                                        {products
                                            .filter((product) => product.id !== selectedProduct.id)
                                            .map((product) => (
                                                <option key={product.id} value={product.id} className="text-black">
                                                    {product.name} ({product.sku})
                                                </option>
                                            ))}
                                    </select>
                                    <select value={recommendationType} onChange={(e) => setRecommendationType(e.target.value)} className="rounded-xl border border-white/20 bg-black/30 px-3 py-2">
                                        {recommendationTypes.map((type) => (
                                            <option key={type} value={type} className="text-black">
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button onClick={handleAddRecommendation} className="mt-2 rounded-xl border border-white/30 px-4 py-2 text-sm hover:bg-white/10">
                                    Add Recommendation
                                </button>

                                <div className="mt-3 space-y-2">
                                    {selectedProduct.recommendations.length === 0 && <p className="text-sm text-white/70">No recommendations assigned yet.</p>}
                                    {selectedProduct.recommendations.map((recommendation) => (
                                        <div key={recommendation.id} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm">
                                            <span>
                                                {recommendation.type}: {recommendation.recommendedProduct.name}
                                            </span>
                                            <button onClick={() => handleDeleteRecommendation(recommendation.id)} className="text-rose-300 hover:text-rose-200">
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
