import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ken Konveksi — Asisten AI Konsultasi, Kalkulasi & Order WhatsApp",
  description:
    "AI Agent bisnis konveksi untuk konsultasi produk, pemilihan bahan kain, spesifikasi sablon/bordir, perhitungan estimasi biaya, hingga form pemesanan WhatsApp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
