import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";

import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const headingFont = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GPBM Virtual Style Studio",
  description: "Your AI Personal Fashion Stylist",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${headingFont.variable} ${bodyFont.variable} min-h-screen bg-[#090515] text-white`}>
        <ThemeProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
