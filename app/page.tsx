import Link from "next/link";
import { Sparkles } from "lucide-react";

const cards = [
  { href: "/studio", title: "Website Mode", desc: "Upload selfie, try outfits, reserve and share looks." },
  { href: "/kiosk", title: "Store Mirror Mode", desc: "Full-screen in-store kiosk with quick interactions." },
  { href: "/wedding-builder", title: "Wedding Look Builder", desc: "Create event-ready combinations by role and function." },
  { href: "/compare", title: "Compare Looks", desc: "Side-by-side outfit comparison and decision making." },
  { href: "/admin", title: "Admin Dashboard", desc: "Garment upload pipeline, inventory controls and analytics." },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs tracking-[0.2em] text-amber-200">
          <Sparkles size={14} /> LUXURY AI STYLING
        </p>
        <h1 className="text-4xl font-bold md:text-6xl">GPBM Virtual Style Studio — Your AI Personal Fashion Stylist</h1>
        <p className="mt-4 max-w-3xl text-white/80">
          A production-ready AI fashion platform for Go Planet and Brand Mark with virtual try-on, recommendations, wedding styling,
          inventory-aware product visibility, reservations, and retail analytics.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="rounded-2xl border border-white/10 bg-[#1a1433] p-5 transition hover:-translate-y-1 hover:bg-[#231b42]">
            <h2 className="text-2xl font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm text-white/75">{card.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
