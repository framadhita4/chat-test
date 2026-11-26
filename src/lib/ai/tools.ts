import { tool } from "ai";
import { z } from "zod";
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  calculateKonveksiQuote,
  formatRupiah,
  formatSizeBreakdown,
  getCatalogOverview,
  getKonveksiConfig,
  KONVEKSI_FABRICS,
  KONVEKSI_PRODUCTS,
  PRINT_METHODS,
  type FabricId,
  type KonveksiOrderDraft,
  type PrintMethodId,
  type ProductId,
} from "@/lib/konveksi/catalog";
import { getVectorStore } from "@/lib/rag";

const PRODUCT_IDS = Object.keys(KONVEKSI_PRODUCTS) as [
  ProductId,
  ...ProductId[],
];
const FABRIC_IDS = Object.keys(KONVEKSI_FABRICS) as [FabricId, ...FabricId[]];
const PRINT_METHOD_IDS = Object.keys(PRINT_METHODS) as [
  PrintMethodId,
  ...PrintMethodId[],
];

export function createAiTools(
  storedOrderDraft?: Partial<KonveksiOrderDraft>,
) {
  return {
  searchKnowledgeBase: tool({
    description:
      "Cari informasi dari knowledge base konveksi (RAG) tentang katalog produk, bahan kain, spesifikasi sablon/bordir, size chart, harga, dan SOP pemesanan.",
    inputSchema: z.object({
      query: z
        .string()
        .min(2)
        .describe("Pertanyaan atau kata kunci pencarian semantik."),
      topK: z
        .number()
        .int()
        .min(1)
        .max(8)
        .optional()
        .describe("Jumlah chunk paling relevan yang diambil (default: 4)."),
    }),
    execute: async ({ query, topK = 4 }) => {
      const store = getVectorStore();
      const results = await store.search(query, topK);

      return {
        query,
        totalMatches: results.length,
        matches: results.map((item) => ({
          documentId: item.chunk.documentId,
          documentTitle: item.chunk.documentTitle,
          source: item.chunk.source,
          chunkIndex: item.chunk.chunkIndex,
          similarity: Number(item.score.toFixed(4)),
          excerpt: item.chunk.content,
        })),
      };
    },
  }),

  getKonveksiCatalog: tool({
    description:
      "Ambil katalog terstruktur konveksi berisi daftar lengkap produk (kaos, polo, kemeja PDH/PDL, hoodie, jaket, jersey, almamater/wearpack, totebag), pilihan bahan kain, jenis sablon/bordir, diskon kuantitas, dan size chart.",
    inputSchema: z.object({
      categoryFilter: z
        .string()
        .optional()
        .describe(
          "Opsional: kata kunci produk atau kategori (mis. 'kaos', 'kemeja', 'jaket', 'jersey', 'bahan').",
        ),
    }),
    execute: async ({ categoryFilter }) => {
      const catalog = getCatalogOverview();
      if (!categoryFilter?.trim()) {
        return catalog;
      }

      const keyword = categoryFilter.toLowerCase();
      const filteredProducts = catalog.products.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          p.category.toLowerCase().includes(keyword) ||
          p.id.toLowerCase().includes(keyword),
      );

      return {
        ...catalog,
        products:
          filteredProducts.length > 0 ? filteredProducts : catalog.products,
        appliedFilter: categoryFilter,
      };
    },
  }),

  calculateKonveksiQuote: tool({
    description:
      "Hitung estimasi biaya pemesanan konveksi secara presisi berdasarkan jenis produk, bahan kain, jumlah pesanan, metode sablon/bordir, lengan panjang, ukuran jumbo (XXL/3XL/4XL), serta estimasi DP 50% dan waktu produksi.",
    inputSchema: z.object({
      productId: z
        .enum(PRODUCT_IDS)
        .describe("ID produk konveksi yang dipesan."),
      fabricId: z
        .enum(FABRIC_IDS)
        .optional()
        .describe(
          "ID bahan kain yang dipilih (opsional, default bahan utama produk).",
        ),
      quantity: z
        .number()
        .int()
        .min(1)
        .max(100000)
        .describe("Total jumlah pesanan dalam pcs."),
      printMethod: z
        .enum(PRINT_METHOD_IDS)
        .optional()
        .describe("Metode sablon atau bordir yang digunakan."),
      extraDesignPoints: z
        .number()
        .int()
        .min(0)
        .max(10)
        .optional()
        .describe(
          "Jumlah titik sablon/bordir tambahan di luar sisi utama (+Rp 7.500/titik/pcs).",
        ),
      longSleeve: z
        .boolean()
        .optional()
        .describe(
          "True jika meminta varian lengan panjang untuk kaos, polo, kemeja, atau jersey.",
        ),
      zipper: z
        .boolean()
        .optional()
        .describe(
          "True jika memakai resleting (mis. zipper hoodie atau totebag beresleting).",
        ),
      extraPocketOrReflector: z
        .boolean()
        .optional()
        .describe(
          "True jika menambah saku khusus atau pita scotlight reflektif.",
        ),
      sizeBreakdown: z
        .object({
          S: z.number().int().min(0).optional(),
          M: z.number().int().min(0).optional(),
          L: z.number().int().min(0).optional(),
          XL: z.number().int().min(0).optional(),
          XXL: z.number().int().min(0).optional(),
          "3XL": z.number().int().min(0).optional(),
          "4XL": z.number().int().min(0).optional(),
        })
        .optional()
        .describe(
          "Rincian jumlah per ukuran untuk menghitung biaya tambahan ukuran jumbo (XXL/3XL/4XL).",
        ),
    }),
    execute: async (input) => {
      const quote = calculateKonveksiQuote(input);
      return {
        ...quote,
        formatted: {
          unitBasePrice: formatRupiah(quote.unitBasePrice),
          discountAmount: formatRupiah(quote.discountAmount),
          totalPrice: formatRupiah(quote.totalPrice),
          averageUnitPrice: formatRupiah(quote.averageUnitPrice),
          dpAmount: formatRupiah(quote.dpAmount),
          remainingAmount: formatRupiah(quote.remainingAmount),
          estimatedWorkDays: `${quote.estimatedDaysMin}–${quote.estimatedDaysMax} hari kerja`,
        },
      };
    },
  }),

  prepareKonveksiOrder: tool({
    description:
      "Validasi kelengkapan data pemesanan konveksi yang dikumpulkan AI langsung di chat, simpan ke draft order, dan buat link + template pesan WhatsApp jika semua field wajib sudah terisi. Jika masih ada field wajib yang kosong, tool akan mengembalikan missingFields agar AI menanyakannya lagi kepada pelanggan.",
    inputSchema: z.object({
      customerName: z.string().optional().describe("Nama lengkap pemesan."),
      organization: z
        .string()
        .optional()
        .describe(
          "Nama instansi, perusahaan, komunitas, atau brand (opsional).",
        ),
      customerWhatsapp: z
        .string()
        .optional()
        .describe("Nomor HP/WhatsApp aktif pemesan."),
      productId: z
        .enum(PRODUCT_IDS)
        .optional()
        .describe(
          "ID produk jika diketahui agar harga bisa dihitung otomatis bila belum ada estimasi.",
        ),
      productName: z
        .string()
        .optional()
        .describe("Nama produk yang dipesan (mis. Kaos Oblong / Kemeja PDH)."),
      fabricId: z
        .enum(FABRIC_IDS)
        .optional()
        .describe("ID bahan kain jika diketahui."),
      fabricName: z
        .string()
        .optional()
        .describe("Nama bahan kain (mis. Cotton Combed 24s, American Drill)."),
      color: z
        .string()
        .optional()
        .describe("Warna kain yang diinginkan (mis. Hitam Jetblack, Navy)."),
      quantity: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe("Jumlah pesanan total (pcs)."),
      sizeBreakdown: z
        .object({
          S: z.number().int().min(0).optional(),
          M: z.number().int().min(0).optional(),
          L: z.number().int().min(0).optional(),
          XL: z.number().int().min(0).optional(),
          XXL: z.number().int().min(0).optional(),
          "3XL": z.number().int().min(0).optional(),
          "4XL": z.number().int().min(0).optional(),
        })
        .optional()
        .describe("Rincian ukuran jika tersedia."),
      sizeBreakdownText: z
        .string()
        .optional()
        .describe(
          "Rincian ukuran dalam bentuk teks (mis. 'M: 10, L: 15, XL: 5').",
        ),
      printMethodId: z
        .enum(PRINT_METHOD_IDS)
        .optional()
        .describe("ID metode sablon/bordir jika diketahui."),
      printMethod: z
        .string()
        .optional()
        .describe(
          "Nama metode sablon/bordir (mis. Sablon DTF Full Color, Bordir Komputer).",
        ),
      designNotes: z
        .string()
        .optional()
        .describe(
          "Detail posisi & keterangan desain (mis. Logo dada kiri 8cm + tulisan punggung).",
        ),
      shippingAddress: z
        .string()
        .optional()
        .describe("Alamat lengkap pengiriman."),
      deadlineDate: z
        .string()
        .optional()
        .describe("Target tanggal selesai/acara (opsional)."),
      notes: z.string().optional().describe("Catatan tambahan dari pelanggan."),
      estimatedTotal: z
        .number()
        .optional()
        .describe("Estimasi total biaya jika sudah dihitung sebelumnya."),
      estimatedDp: z
        .number()
        .optional()
        .describe("Estimasi DP 50% jika sudah dihitung sebelumnya."),
      estimatedDays: z
        .string()
        .optional()
        .describe("Estimasi lama pengerjaan (mis. '10–14 hari kerja')."),
      longSleeve: z.boolean().optional(),
      zipper: z.boolean().optional(),
      extraPocketOrReflector: z.boolean().optional(),
    }),
    execute: async (input) => {
      const config = getKonveksiConfig();

      const resolvedQuantity =
        input.quantity ?? storedOrderDraft?.quantity ?? 0;
      let estimatedTotal =
        input.estimatedTotal ?? storedOrderDraft?.estimatedTotal;
      let estimatedDp = input.estimatedDp ?? storedOrderDraft?.estimatedDp;
      let estimatedDays =
        input.estimatedDays || storedOrderDraft?.estimatedDays;
      let resolvedFabricName =
        input.fabricName || storedOrderDraft?.fabricName;
      let resolvedPrintMethod =
        input.printMethod || storedOrderDraft?.printMethod;

      if ((!estimatedTotal || estimatedTotal <= 0) && input.productId && resolvedQuantity >= 1) {
        const autoQuote = calculateKonveksiQuote({
          productId: input.productId,
          fabricId: input.fabricId,
          quantity: resolvedQuantity,
          printMethod: input.printMethodId,
          longSleeve: input.longSleeve,
          zipper: input.zipper,
          extraPocketOrReflector: input.extraPocketOrReflector,
          sizeBreakdown: input.sizeBreakdown,
        });
        estimatedTotal = autoQuote.totalPrice;
        estimatedDp = autoQuote.dpAmount;
        estimatedDays = `${autoQuote.estimatedDaysMin}–${autoQuote.estimatedDaysMax} hari kerja`;
        resolvedFabricName = resolvedFabricName || autoQuote.fabricName;
        resolvedPrintMethod = resolvedPrintMethod || autoQuote.printMethodName;
      }

      const sizeText =
        input.sizeBreakdownText?.trim() ||
        formatSizeBreakdown(input.sizeBreakdown) ||
        storedOrderDraft?.sizeBreakdownText?.trim() ||
        "";

      const orderDraft: KonveksiOrderDraft = {
        customerName:
          input.customerName?.trim() ||
          storedOrderDraft?.customerName?.trim() ||
          "",
        organization:
          input.organization?.trim() ||
          storedOrderDraft?.organization?.trim() ||
          "",
        customerWhatsapp:
          input.customerWhatsapp?.trim() ||
          storedOrderDraft?.customerWhatsapp?.trim() ||
          "",
        productName:
          input.productName?.trim() ||
          storedOrderDraft?.productName?.trim() ||
          "",
        fabricName: resolvedFabricName?.trim() || "",
        color:
          input.color?.trim() || storedOrderDraft?.color?.trim() || "",
        quantity: resolvedQuantity,
        sizeBreakdownText: sizeText,
        printMethod: resolvedPrintMethod?.trim() || "",
        designNotes:
          input.designNotes?.trim() ||
          storedOrderDraft?.designNotes?.trim() ||
          "",
        shippingAddress:
          input.shippingAddress?.trim() ||
          storedOrderDraft?.shippingAddress?.trim() ||
          "",
        deadlineDate:
          input.deadlineDate?.trim() ||
          storedOrderDraft?.deadlineDate?.trim() ||
          "",
        notes:
          input.notes?.trim() || storedOrderDraft?.notes?.trim() || "",
        estimatedTotal,
        estimatedDp,
        estimatedDays,
      };

      const missingFields: string[] = [];
      if (orderDraft.customerName.length < 2) {
        missingFields.push("Nama Pemesan");
      }
      if (orderDraft.customerWhatsapp.replace(/\D/g, "").length < 8) {
        missingFields.push("Nomor WhatsApp Pemesan");
      }
      if (orderDraft.productName.length < 2) {
        missingFields.push("Produk Konveksi");
      }
      if (orderDraft.quantity < 1) {
        missingFields.push("Jumlah Pesanan (pcs)");
      }
      if (!orderDraft.sizeBreakdownText) {
        missingFields.push("Rincian Ukuran (S/M/L/XL/XXL)");
      }
      if (!orderDraft.shippingAddress || orderDraft.shippingAddress.length < 5) {
        missingFields.push("Alamat Pengiriman Lengkap");
      }

      const readyToSend = missingFields.length === 0;
      const whatsappMessage = readyToSend
        ? buildWhatsAppOrderMessage(orderDraft, config.brandName)
        : null;
      const whatsappUrl =
        readyToSend && whatsappMessage
          ? buildWhatsAppUrl(whatsappMessage, config.whatsappNumber)
          : null;

      return {
        brandName: config.brandName,
        adminWhatsapp: config.whatsappNumber,
        readyToSend,
        missingFields,
        orderDraft,
        whatsappMessage,
        whatsappUrl,
      };
    },
  }),
  };
}

export const aiTools = createAiTools();
