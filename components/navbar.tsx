import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/studio", label: "Studio" },
  { href: "/kiosk", label: "Kiosk" },
  { href: "/wedding-builder", label: "Wedding Builder" },
  { href: "/compare", label: "Compare" },
  { href: "/admin", label: "Admin" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0f0b1f]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-white md:px-8">
        <Link href="/" className="text-sm font-semibold tracking-[0.2em] text-amber-200">
          GPBM VIRTUAL STYLE STUDIO
        </Link>
        <nav className="hidden gap-4 text-sm md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded px-3 py-1 transition hover:bg-white/10">
              {link.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
