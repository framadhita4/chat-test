"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  formatRupiah,
  type KonveksiOrderDraft,
  type QuoteResult,
} from "@/lib/konveksi/catalog";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  MessageCircleIcon,
} from "lucide-react";
import { useState } from "react";

interface QuoteBreakdownCardProps {
  quote: QuoteResult;
  onContinueToOrder?: (quote: QuoteResult) => void;
  disabled?: boolean;
}

export function QuoteBreakdownCard({
  quote,
  onContinueToOrder,
  disabled,
}: QuoteBreakdownCardProps) {
  const jumboList = [
    quote.jumboCounts.XXL > 0 ? `XXL (${quote.jumboCounts.XXL})` : null,
    quote.jumboCounts["3XL"] > 0 ? `3XL (${quote.jumboCounts["3XL"]})` : null,
    quote.jumboCounts["4XL"] > 0 ? `4XL (${quote.jumboCounts["4XL"]})` : null,
  ].filter(Boolean);

  return (
    <div className="my-2 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <CalculatorIcon className="size-4 text-primary" />
          <span className="font-semibold text-xs">
            Estimasi Biaya Produksi Konveksi
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="text-[10px]" variant="secondary">
            {quote.quantity} pcs
          </Badge>
          {quote.discountPercent > 0 && (
            <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 text-[10px]" variant="outline">
              Diskon {quote.discountPercent}%
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4 text-xs">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/30 p-2.5">
            <p className="text-[11px] text-muted-foreground">Produk & Bahan</p>
            <p className="mt-0.5 font-medium">{quote.productName}</p>
            <p className="text-[11px] text-muted-foreground">{quote.fabricName}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-2.5">
            <p className="text-[11px] text-muted-foreground">Aplikasi & Estimasi</p>
            <p className="mt-0.5 font-medium">{quote.printMethodName}</p>
            <p className="text-[11px] text-muted-foreground">
              Estimasi {quote.estimatedDaysMin}–{quote.estimatedDaysMax} hari kerja
            </p>
          </div>
        </div>

        <div className="space-y-1.5 rounded-lg border bg-background p-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Harga dasar ({quote.quantity} × {formatRupiah(quote.unitBasePrice)})
            </span>
            <span className="font-medium tabular-nums">
              {formatRupiah(quote.subtotalBase)}
            </span>
          </div>

          {quote.discountAmount > 0 && (
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
              <span>{quote.discountLabel}</span>
              <span className="font-medium tabular-nums">
                -{formatRupiah(quote.discountAmount)}
              </span>
            </div>
          )}

          {quote.printTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {quote.printMethodName} ({quote.quantity} × {formatRupiah(quote.printCostPerUnit)})
              </span>
              <span className="font-medium tabular-nums">
                +{formatRupiah(quote.printTotal)}
              </span>
            </div>
          )}

          {quote.extraDesignTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Titik desain tambahan ({quote.extraDesignPoints} titik × {quote.quantity})
              </span>
              <span className="font-medium tabular-nums">
                +{formatRupiah(quote.extraDesignTotal)}
              </span>
            </div>
          )}

          {quote.longSleeveTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Tambahan lengan panjang ({quote.quantity} × {formatRupiah(quote.longSleeveCostPerUnit)})
              </span>
              <span className="font-medium tabular-nums">
                +{formatRupiah(quote.longSleeveTotal)}
              </span>
            </div>
          )}

          {quote.zipperTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Tambahan resleting YKK ({quote.quantity} pcs)
              </span>
              <span className="font-medium tabular-nums">
                +{formatRupiah(quote.zipperTotal)}
              </span>
            </div>
          )}

          {quote.extraPocketTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Saku khusus / scotlight ({quote.quantity} pcs)
              </span>
              <span className="font-medium tabular-nums">
                +{formatRupiah(quote.extraPocketTotal)}
              </span>
            </div>
          )}

          {quote.jumboSurchargeTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Tambahan ukuran jumbo ({jumboList.join(", ")})
              </span>
              <span className="font-medium tabular-nums">
                +{formatRupiah(quote.jumboSurchargeTotal)}
              </span>
            </div>
          )}

          <div className="my-1.5 border-t pt-2">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Estimasi Total</span>
              <span className="text-primary tabular-nums">
                {formatRupiah(quote.totalPrice)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Rata-rata per pcs</span>
              <span className="tabular-nums">
                {formatRupiah(quote.averageUnitPrice)} / pcs
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <span className="text-[11px] text-muted-foreground">
              DP Awal ({quote.dpPercent}%)
            </span>
            <p className="font-semibold text-sm tabular-nums">
              {formatRupiah(quote.dpAmount)}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 px-3 py-2">
            <span className="text-[11px] text-muted-foreground">
              Pelunasan Setelah QC
            </span>
            <p className="font-semibold text-sm tabular-nums">
              {formatRupiah(quote.remainingAmount)}
            </p>
          </div>
        </div>

        {quote.warnings.length > 0 && (
          <div className="space-y-1 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-300">
            {quote.warnings.map((w, idx) => (
              <div className="flex items-start gap-1.5" key={idx}>
                <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {onContinueToOrder && (
          <Button
            className="w-full"
            disabled={disabled}
            onClick={() => onContinueToOrder(quote)}
            size="sm"
            type="button"
          >
            Lanjut Pesan Sekarang
            <ArrowRightIcon className="ml-1.5 size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface WhatsAppOrderButtonCardProps {
  orderDraft: KonveksiOrderDraft;
  whatsappMessage?: string | null;
  whatsappUrl?: string | null;
  brandName?: string;
  adminWhatsapp?: string;
}

export function WhatsAppOrderButtonCard({
  orderDraft,
  whatsappMessage: providedMessage,
  whatsappUrl: providedUrl,
  brandName = "Ken Konveksi",
  adminWhatsapp,
}: WhatsAppOrderButtonCardProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const whatsappMessage =
    providedMessage || buildWhatsAppOrderMessage(orderDraft, brandName);
  const whatsappUrl =
    providedUrl || buildWhatsAppUrl(whatsappMessage, adminWhatsapp);

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="my-2 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <CheckCircle2Icon className="size-4 text-emerald-600" />
          <span className="font-semibold text-xs">Data Pesanan Lengkap</span>
        </div>
        <Badge className="text-[10px]" variant="secondary">
          {brandName}
        </Badge>
      </div>

      <div className="space-y-3 p-3.5 text-xs">
        <div className="space-y-1 rounded-lg border bg-background p-2.5 text-[11px]">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Pemesan</span>
            <span className="text-right font-medium">
              {orderDraft.customerName} ({orderDraft.customerWhatsapp})
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Pesanan</span>
            <span className="text-right font-medium">
              {orderDraft.quantity} pcs {orderDraft.productName}
              {orderDraft.fabricName ? ` • ${orderDraft.fabricName}` : ""}
            </span>
          </div>
          {orderDraft.sizeBreakdownText && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Ukuran</span>
              <span className="text-right font-medium">
                {orderDraft.sizeBreakdownText}
              </span>
            </div>
          )}
          {orderDraft.shippingAddress && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Alamat</span>
              <span className="text-right font-medium">
                {orderDraft.shippingAddress}
              </span>
            </div>
          )}
          {orderDraft.estimatedTotal && orderDraft.estimatedTotal > 0 ? (
            <div className="flex justify-between gap-2 border-t pt-1">
              <span className="text-muted-foreground">Estimasi Total</span>
              <span className="text-right font-semibold text-primary tabular-nums">
                {formatRupiah(orderDraft.estimatedTotal)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={handleOpenWhatsApp}
            size="sm"
            type="button"
          >
            <MessageCircleIcon className="mr-1.5 size-3.5" />
            Order ke wa
            <ExternalLinkIcon className="ml-1.5 size-3" />
          </Button>

          <Button
            onClick={() => void handleCopyMessage()}
            size="sm"
            type="button"
            variant="ghost"
          >
            {copied ? (
              <>
                <CheckIcon className="mr-1 size-3.5 text-emerald-600" />
                Tersalin
              </>
            ) : (
              <>
                <CopyIcon className="mr-1 size-3.5" />
                Salin
              </>
            )}
          </Button>
        </div>

        <div>
          <button
            className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            onClick={() => setShowPreview((prev) => !prev)}
            type="button"
          >
            {showPreview ? "Sembunyikan" : "Lihat"} template pesan WhatsApp
          </button>
          {showPreview && (
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/40 p-2.5 font-mono text-[11px] leading-relaxed">
              {whatsappMessage}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
