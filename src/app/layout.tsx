import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "CuanTepat",
  description: "Kalkulator harga pokok dan harga jual untuk UMKM kuliner.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="bg-canvas font-sans text-ink tabular-nums">{children}</body>
    </html>
  );
}
