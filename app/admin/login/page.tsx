"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        const response = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });

        setLoading(false);

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            setError(data.error || "Login failed");
            return;
        }

        const next = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") || "/admin" : "/admin";
        router.push(next);
        router.refresh();
    };

    return (
        <div className="mx-auto max-w-md rounded-3xl border border-white/15 bg-black/30 p-8 shadow-2xl backdrop-blur">
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-amber-200">GPBM Internal Access</p>
            <h1 className="text-3xl font-semibold">Admin Login</h1>
            <p className="mt-2 text-sm text-white/70">Sign in to manage products, inventory, and recommendations.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Admin password"
                    className="w-full rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-white outline-none ring-amber-300/50 focus:ring"
                />

                {error && <p className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-amber-400 px-4 py-3 font-semibold text-black transition hover:bg-amber-300 disabled:opacity-70"
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>
            </form>
        </div>
    );
}
