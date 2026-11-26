export type ProductId =
  | "kaos-oblong"
  | "polo-shirt"
  | "kemeja-pdh"
  | "kemeja-pdl"
  | "hoodie"
  | "jaket-varsity"
  | "jersey-printing"
  | "almamater-wearpack"
  | "totebag";

export type FabricId =
  | "combed-30s"
  | "combed-24s"
  | "combed-20s"
  | "cotton-bamboo"
  | "lacoste-cvc"
  | "lacoste-cotton"
  | "american-drill"
  | "nagata-drill"
  | "ripstop"
  | "cotton-fleece"
  | "baby-terry"
  | "taslan-balon"
  | "dryfit-milano"
  | "canvas-marsoto";

export type PrintMethodId =
  | "polos"
  | "sablon-rubber"
  | "sablon-dtf"
  | "sablon-plastisol"
  | "sablon-discharge"
  | "bordir-standar"
  | "bordir-timbul"
  | "full-sublim";

export interface KonveksiProduct {
  id: ProductId;
  name: string;
  category: string;
  moq: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  supportsLongSleeve: boolean;
  longSleeveSurcharge: number;
  supportsZipper: boolean;
  defaultPrintMethod: PrintMethodId;
  compatibleFabrics: FabricId[];
  fabricPrices: Partial<Record<FabricId, number>>;
  highlights: string[];
}

export interface KonveksiFabric {
  id: FabricId;
  name: string;
  gsm: string;
  characteristics: string;
  bestFor: string;
}

export interface PrintMethodSpec {
  id: PrintMethodId;
  name: string;
  pricePerUnit: number;
  minRecommendedQty: number;
  description: string;
}

export interface DiscountTier {
  minQty: number;
  maxQty: number | null;
  discountPercent: number;
  label: string;
}

export interface SizeBreakdown {
  S?: number;
  M?: number;
  L?: number;
  XL?: number;
  XXL?: number;
  "3XL"?: number;
  "4XL"?: number;
}

export interface QuoteInput {
  productId: ProductId;
  fabricId?: FabricId;
  quantity: number;
  printMethod?: PrintMethodId;
  extraDesignPoints?: number;
  longSleeve?: boolean;
  zipper?: boolean;
  extraPocketOrReflector?: boolean;
  sizeBreakdown?: SizeBreakdown;
}

export interface QuoteResult {
  productId: ProductId;
  productName: string;
  fabricId: FabricId;
  fabricName: string;
  printMethodId: PrintMethodId;
  printMethodName: string;
  quantity: number;
  moq: number;
  meetsMoq: boolean;
  unitBasePrice: number;
  subtotalBase: number;
  discountPercent: number;
  discountLabel: string;
  discountAmount: number;
  printCostPerUnit: number;
  printTotal: number;
  extraDesignPoints: number;
  extraDesignCostPerPoint: number;
  extraDesignTotal: number;
  longSleeve: boolean;
  longSleeveCostPerUnit: number;
  longSleeveTotal: number;
  zipper: boolean;
  zipperTotal: number;
  extraPocketOrReflector: boolean;
  extraPocketTotal: number;
  jumboCounts: {
    XXL: number;
    "3XL": number;
    "4XL": number;
  };
  jumboSurchargeTotal: number;
  totalPrice: number;
  averageUnitPrice: number;
  dpPercent: number;
  dpAmount: number;
  remainingAmount: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  sizeBreakdownSummary: string;
  warnings: string[];
}

export const KONVEKSI_FABRICS: Record<FabricId, KonveksiFabric> = {
  "combed-30s": {
    id: "combed-30s",
    name: "Cotton Combed 30s",
    gsm: "140–150 gsm",
    characteristics:
      "100% serat kapas murni, halus, ringan, adem, dan menyerap keringat dengan baik.",
    bestFor: "Kaos event, kaos distro, merchandise, dan pemakaian harian tropis.",
  },
  "combed-24s": {
    id: "combed-24s",
    name: "Cotton Combed 24s",
    gsm: "170–185 gsm",
    characteristics:
      "Ketebalan sedang (bestseller), tidak menerawang, tetap adem, dan jatuh rapi di badan.",
    bestFor: "Kaos komunitas, seragam kasual perusahaan, kaos brand premium.",
  },
  "combed-20s": {
    id: "combed-20s",
    name: "Cotton Combed 20s",
    gsm: "190–210 gsm",
    characteristics:
      "Paling tebal di lini combed, struktur kokoh, awet dicuci berulang kali.",
    bestFor: "Kaos oversize, kaos kerja lapangan ringan, streetwear.",
  },
  "cotton-bamboo": {
    id: "cotton-bamboo",
    name: "Cotton Bamboo 30s",
    gsm: "150–160 gsm",
    characteristics:
      "Campuran katun & serat bambu, super lembut, antibakteri alami, anti-bau, ekstra sejuk.",
    bestFor: "Kaos eksklusif, executive gift, brand fashion sensitif kulit.",
  },
  "lacoste-cvc": {
    id: "lacoste-cvc",
    name: "Lacoste CVC Pique",
    gsm: "200–220 gsm",
    characteristics:
      "Rajutan berpori segi enam khas polo, rapi, tidak mudah melar atau menyusut.",
    bestFor: "Polo shirt seragam kantor, panitia event, komunitas otomotif.",
  },
  "lacoste-cotton": {
    id: "lacoste-cotton",
    name: "Lacoste Cotton 100%",
    gsm: "210–230 gsm",
    characteristics:
      "Lebih lembut dan lebih dingin dibanding CVC karena 100% katun.",
    bestFor: "Polo shirt premium, seragam hospitality & golf/corporate gift.",
  },
  "american-drill": {
    id: "american-drill",
    name: "American Drill 1919",
    gsm: "220–240 gsm",
    characteristics:
      "Tenunan twill diagonal kuat, tidak mudah kusut, tekstur tegas & profesional.",
    bestFor: "Kemeja PDH, seragam kerja, almamater ekonomis, dan totebag tebal.",
  },
  "nagata-drill": {
    id: "nagata-drill",
    name: "Nagata / Japan Drill",
    gsm: "230–250 gsm",
    characteristics:
      "Kadar katun tinggi, lebih adem dan halus dibanding American Drill, warna awet.",
    bestFor: "Kemeja PDH/PDL premium, seragam organisasi, jas almamater.",
  },
  ripstop: {
    id: "ripstop",
    name: "Ripstop Kotak-Kotak",
    gsm: "200–220 gsm",
    characteristics:
      "Pola kotak penguat benang anti-sobek, ringan, cepat kering, tangguh di lapangan.",
    bestFor: "Kemeja PDL outdoor, seragam teknik/tambang, wearpack ringan.",
  },
  "cotton-fleece": {
    id: "cotton-fleece",
    name: "Cotton Fleece",
    gsm: "280–330 gsm",
    characteristics:
      "Luar halus rata, dalam berbulu lembut & hangat, empuk serta nyaman.",
    bestFor: "Hoodie pullover, zipper hoodie, crewneck, dan jaket varsity.",
  },
  "baby-terry": {
    id: "baby-terry",
    name: "Baby Terry",
    gsm: "240–260 gsm",
    characteristics:
      "Bagian dalam berloop (tidak berbulu tebal), lebih ringan dan tidak gerah.",
    bestFor: "Sweater/hoodie harian untuk cuaca hangat & seragam santai.",
  },
  "taslan-balon": {
    id: "taslan-balon",
    name: "Taslan / Parasut Micro",
    gsm: "140–170 gsm",
    characteristics:
      "Tahan angin (windproof) dan tahan percikan air (water-repellent), ringan.",
    bestFor: "Jaket coach, bomber, jaket motor/touring, dan jaket outdoor.",
  },
  "dryfit-milano": {
    id: "dryfit-milano",
    name: "Dryfit Milano / Benzema",
    gsm: "150–170 gsm",
    characteristics:
      "Berpori zig-zag/heksagonal, sangat ringan, quick-dry, menyerap dan melepas keringat cepat.",
    bestFor: "Jersey futsal, sepak bola, lari, sepeda, dan esports full print.",
  },
  "canvas-marsoto": {
    id: "canvas-marsoto",
    name: "Canvas Marsoto / Twill",
    gsm: "260–300 gsm",
    characteristics:
      "Serat kanvas tebal, kokoh, dan bertekstur natural yang kuat menahan beban.",
    bestFor: "Totebag seminar/brand, goodiebag, apron, dan jaket canvas.",
  },
};

export const PRINT_METHODS: Record<PrintMethodId, PrintMethodSpec> = {
  polos: {
    id: "polos",
    name: "Polos (Tanpa Sablon/Bordir)",
    pricePerUnit: 0,
    minRecommendedQty: 12,
    description: "Produk polos siap pakai atau untuk kebutuhan basic.",
  },
  "sablon-rubber": {
    id: "sablon-rubber",
    name: "Sablon Rubber (1 Sisi)",
    pricePerUnit: 10000,
    minRecommendedQty: 12,
    description: "Tinta elastis menutup serat kain dengan baik, ekonomis & awet.",
  },
  "sablon-dtf": {
    id: "sablon-dtf",
    name: "Sablon DTF Full Color (1 Sisi)",
    pricePerUnit: 12000,
    minRecommendedQty: 12,
    description: "Direct Transfer Film, cocok untuk logo full color, gradasi, dan foto.",
  },
  "sablon-plastisol": {
    id: "sablon-plastisol",
    name: "Sablon Plastisol (1 Sisi)",
    pricePerUnit: 15000,
    minRecommendedQty: 24,
    description: "Tinta berbasis minyak standar distro, warna pekat, detail tajam, tahan lama.",
  },
  "sablon-discharge": {
    id: "sablon-discharge",
    name: "Sablon Discharge (1 Sisi)",
    pricePerUnit: 18000,
    minRecommendedQty: 24,
    description: "Tinta cabut warna yang meresap ke serat katun, hasil lembut tanpa terasa tebal.",
  },
  "bordir-standar": {
    id: "bordir-standar",
    name: "Bordir Komputer Standar (1–2 Titik)",
    pricePerUnit: 15000,
    minRecommendedQty: 12,
    description: "Bordir mesin komputer presisi untuk logo dada & tulisan punggung/lengan.",
  },
  "bordir-timbul": {
    id: "bordir-timbul",
    name: "Bordir Komputer 3D / Timbul",
    pricePerUnit: 22000,
    minRecommendedQty: 12,
    description: "Bordir berdimensi tebal dengan busa/emblem untuk tampilan eksklusif.",
  },
  "full-sublim": {
    id: "full-sublim",
    name: "Printing Sublimasi Full Body",
    pricePerUnit: 20000,
    minRecommendedQty: 12,
    description: "Cetak full motif menyatu ke serat kain polyester/dryfit tanpa luntur.",
  },
};

export const KONVEKSI_PRODUCTS: Record<ProductId, KonveksiProduct> = {
  "kaos-oblong": {
    id: "kaos-oblong",
    name: "Kaos Oblong / T-Shirt",
    category: "Kaos",
    moq: 12,
    estimatedDaysMin: 7,
    estimatedDaysMax: 10,
    supportsLongSleeve: true,
    longSleeveSurcharge: 10000,
    supportsZipper: false,
    defaultPrintMethod: "sablon-dtf",
    compatibleFabrics: ["combed-30s", "combed-24s", "combed-20s", "cotton-bamboo"],
    fabricPrices: {
      "combed-30s": 50000,
      "combed-24s": 55000,
      "combed-20s": 62000,
      "cotton-bamboo": 68000,
    },
    highlights: [
      "Jahitan rantai pundak & overdeck 3 jarum rapi standar distro",
      "Pilihan kerah O-neck / V-neck dan rib leher anti-melar",
      "Cocok untuk kaos event, komunitas, merchandise, hingga brand clothing",
    ],
  },
  "polo-shirt": {
    id: "polo-shirt",
    name: "Polo Shirt / Kaos Kerah",
    category: "Kaos Berkerah",
    moq: 12,
    estimatedDaysMin: 10,
    estimatedDaysMax: 14,
    supportsLongSleeve: true,
    longSleeveSurcharge: 10000,
    supportsZipper: false,
    defaultPrintMethod: "bordir-standar",
    compatibleFabrics: ["lacoste-cvc", "lacoste-cotton", "combed-24s"],
    fabricPrices: {
      "lacoste-cvc": 75000,
      "lacoste-cotton": 88000,
      "combed-24s": 70000,
    },
    highlights: [
      "Kerah & manset rajut custom list warna",
      "Plaket 2–3 kancing rapi dengan penguat obras 4 benang",
      "Ideal untuk seragam kantor kasual, panitia, dan komunitas",
    ],
  },
  "kemeja-pdh": {
    id: "kemeja-pdh",
    name: "Kemeja PDH / Seragam Kantor",
    category: "Kemeja",
    moq: 12,
    estimatedDaysMin: 12,
    estimatedDaysMax: 16,
    supportsLongSleeve: true,
    longSleeveSurcharge: 12000,
    supportsZipper: false,
    defaultPrintMethod: "bordir-standar",
    compatibleFabrics: ["american-drill", "nagata-drill"],
    fabricPrices: {
      "american-drill": 115000,
      "nagata-drill": 135000,
    },
    highlights: [
      "Pola formal/semi-formal dengan kerah keras & saku tempel/bobok",
      "Jahitan double stick presisi dan kancing eksklusif",
      "Bisa tambah skoder bahu, lubang pulpen, dan variasi lis warna",
    ],
  },
  "kemeja-pdl": {
    id: "kemeja-pdl",
    name: "Kemeja PDL / Lapangan",
    category: "Kemeja",
    moq: 12,
    estimatedDaysMin: 14,
    estimatedDaysMax: 18,
    supportsLongSleeve: true,
    longSleeveSurcharge: 12000,
    supportsZipper: false,
    defaultPrintMethod: "bordir-standar",
    compatibleFabrics: ["ripstop", "nagata-drill", "american-drill"],
    fabricPrices: {
      ripstop: 135000,
      "nagata-drill": 145000,
      "american-drill": 125000,
    },
    highlights: [
      "Dua saku dada bertutup + skoder bahu & tali penggulung lengan",
      "Ventilasi punggung (air flow) opsional untuk kerja lapangan",
      "Tahan gesekan & sobek untuk kegiatan outdoor, teknik, dan organisasi",
    ],
  },
  hoodie: {
    id: "hoodie",
    name: "Hoodie / Sweater Pullover",
    category: "Outerwear",
    moq: 12,
    estimatedDaysMin: 14,
    estimatedDaysMax: 18,
    supportsLongSleeve: false,
    longSleeveSurcharge: 0,
    supportsZipper: true,
    defaultPrintMethod: "sablon-plastisol",
    compatibleFabrics: ["cotton-fleece", "baby-terry"],
    fabricPrices: {
      "cotton-fleece": 145000,
      "baby-terry": 130000,
    },
    highlights: [
      "Tali hoodie cotton dengan stopper/eyelets metal rapi",
      "Saku kangguru depan dengan penguat jahitan bartack",
      "Opsi model Pullover, Crewneck, atau Zipper Hoodie",
    ],
  },
  "jaket-varsity": {
    id: "jaket-varsity",
    name: "Jaket Varsity / Coach / Bomber",
    category: "Outerwear",
    moq: 12,
    estimatedDaysMin: 14,
    estimatedDaysMax: 21,
    supportsLongSleeve: false,
    longSleeveSurcharge: 0,
    supportsZipper: true,
    defaultPrintMethod: "bordir-timbul",
    compatibleFabrics: ["cotton-fleece", "taslan-balon", "canvas-marsoto"],
    fabricPrices: {
      "cotton-fleece": 175000,
      "taslan-balon": 170000,
      "canvas-marsoto": 185000,
    },
    highlights: [
      "Furing dalam adem (quilting / jaring / satin puring)",
      "Kancing snap metal atau resleting YKK berkualitas",
      "Cocok untuk jaket angkatan, komunitas motor, dan brand outerwear",
    ],
  },
  "jersey-printing": {
    id: "jersey-printing",
    name: "Jersey Olahraga / Esports",
    category: "Sportswear",
    moq: 12,
    estimatedDaysMin: 10,
    estimatedDaysMax: 14,
    supportsLongSleeve: true,
    longSleeveSurcharge: 10000,
    supportsZipper: false,
    defaultPrintMethod: "full-sublim",
    compatibleFabrics: ["dryfit-milano"],
    fabricPrices: {
      "dryfit-milano": 85000,
    },
    highlights: [
      "Gratis custom nama & nomor punggung per pemain",
      "Pilihan kerah V-neck sport, kerah sanghai, atau kerah polo sport",
      "Tinta sublimasi OEKO-TEX cerah, anti-luntur, dan ringan dipakai bertanding",
    ],
  },
  "almamater-wearpack": {
    id: "almamater-wearpack",
    name: "Jas Almamater / Wearpack Safety",
    category: "Seragam Khusus",
    moq: 20,
    estimatedDaysMin: 14,
    estimatedDaysMax: 21,
    supportsLongSleeve: false,
    longSleeveSurcharge: 0,
    supportsZipper: true,
    defaultPrintMethod: "bordir-standar",
    compatibleFabrics: ["american-drill", "nagata-drill", "ripstop", "canvas-marsoto"],
    fabricPrices: {
      "american-drill": 155000,
      "nagata-drill": 175000,
      ripstop: 170000,
      "canvas-marsoto": 185000,
    },
    highlights: [
      "Jas almamater berfuring penuh + bantalan bahu rapi",
      "Wearpack safety mendukung pita scotlight reflektif 3M / lokal",
      "Jahitan rantai kuat untuk kebutuhan industri, bengkel, dan kampus",
    ],
  },
  totebag: {
    id: "totebag",
    name: "Totebag / Goodiebag Custom",
    category: "Tas & Aksesoris",
    moq: 24,
    estimatedDaysMin: 7,
    estimatedDaysMax: 10,
    supportsLongSleeve: false,
    longSleeveSurcharge: 0,
    supportsZipper: true,
    defaultPrintMethod: "sablon-dtf",
    compatibleFabrics: ["canvas-marsoto", "american-drill"],
    fabricPrices: {
      "canvas-marsoto": 32000,
      "american-drill": 28000,
    },
    highlights: [
      "Ukuran standar 30x40 cm atau custom sesuai kebutuhan seminar/brand",
      "Tali webbing/kanvas dengan jahitan silang (X-box) kuat menahan beban",
      "Opsi tambahan resleting, kancing magnet, dan saku dalam",
    ],
  },
};

export const DISCOUNT_TIERS: DiscountTier[] = [
  { minQty: 12, maxQty: 23, discountPercent: 0, label: "Standar (12–23 pcs)" },
  { minQty: 24, maxQty: 49, discountPercent: 5, label: "Grosir Tier 1 (24–49 pcs, Diskon 5%)" },
  { minQty: 50, maxQty: 99, discountPercent: 10, label: "Grosir Tier 2 (50–99 pcs, Diskon 10%)" },
  { minQty: 100, maxQty: 249, discountPercent: 15, label: "Korporat (100–249 pcs, Diskon 15%)" },
  { minQty: 250, maxQty: null, discountPercent: 20, label: "Partai Besar (250+ pcs, Diskon 20%)" },
];

export const JUMBO_SURCHARGES = {
  XXL: 10000,
  "3XL": 15000,
  "4XL": 20000,
} as const;

export const EXTRA_DESIGN_POINT_PRICE = 7500;
export const ZIPPER_SURCHARGE = 15000;
export const EXTRA_POCKET_OR_REFLECTOR_SURCHARGE = 10000;

export function normalizeWhatsappNumber(raw?: string | null): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return "6281234567890";
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith("8")) {
    return `62${digits}`;
  }
  return digits;
}

export function getKonveksiConfig() {
  return {
    brandName:
      process.env.NEXT_PUBLIC_KONVEKSI_NAME?.trim() || "Ken Konveksi",
    city:
      process.env.NEXT_PUBLIC_KONVEKSI_CITY?.trim() || "Bandung & Jabodetabek",
    whatsappNumber: normalizeWhatsappNumber(
      process.env.KONVEKSI_WHATSAPP_NUMBER ||
        process.env.NEXT_PUBLIC_KONVEKSI_WA,
    ),
    dpPercentage: 50,
  };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function getDiscountTier(quantity: number): DiscountTier {
  for (let i = DISCOUNT_TIERS.length - 1; i >= 0; i--) {
    if (quantity >= DISCOUNT_TIERS[i].minQty) {
      return DISCOUNT_TIERS[i];
    }
  }
  return {
    minQty: 1,
    maxQty: 11,
    discountPercent: 0,
    label: "Di bawah MOQ (< 12 pcs)",
  };
}

export function formatSizeBreakdown(sizes?: SizeBreakdown): string {
  if (!sizes) return "";
  const order: Array<keyof SizeBreakdown> = [
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "3XL",
    "4XL",
  ];
  return order
    .filter((key) => typeof sizes[key] === "number" && (sizes[key] ?? 0) > 0)
    .map((key) => `${key}: ${sizes[key]}`)
    .join(", ");
}

export function calculateKonveksiQuote(input: QuoteInput): QuoteResult {
  const product = KONVEKSI_PRODUCTS[input.productId];
  const warnings: string[] = [];

  const selectedFabricId =
    input.fabricId && product.compatibleFabrics.includes(input.fabricId)
      ? input.fabricId
      : product.compatibleFabrics[0];

  if (input.fabricId && !product.compatibleFabrics.includes(input.fabricId)) {
    warnings.push(
      `Bahan "${KONVEKSI_FABRICS[input.fabricId]?.name ?? input.fabricId}" kurang umum untuk ${product.name}; perhitungan dialihkan ke bahan rekomendasi "${KONVEKSI_FABRICS[selectedFabricId].name}".`,
    );
  }

  const fabric = KONVEKSI_FABRICS[selectedFabricId];
  const unitBasePrice =
    product.fabricPrices[selectedFabricId] ??
    Object.values(product.fabricPrices)[0] ??
    75000;

  const printMethodId = input.printMethod ?? product.defaultPrintMethod;
  const printSpec = PRINT_METHODS[printMethodId];

  if (input.quantity < product.moq) {
    warnings.push(
      `Minimal order (MOQ) untuk ${product.name} adalah ${product.moq} pcs. Pesanan di bawah MOQ dapat dikenakan biaya setup sablon/pola atau penyesuaian harga konfirmasi admin.`,
    );
  }

  if (input.quantity < printSpec.minRecommendedQty) {
    warnings.push(
      `Metode ${printSpec.name} direkomendasikan minimal ${printSpec.minRecommendedQty} pcs agar biaya cetak lebih efisien (alternatif hemat untuk <24 pcs: Sablon DTF).`,
    );
  }

  const tier = getDiscountTier(input.quantity);
  const subtotalBase = unitBasePrice * input.quantity;
  const discountAmount = Math.round((subtotalBase * tier.discountPercent) / 100);

  const printCostPerUnit = printSpec.pricePerUnit;
  const printTotal = printCostPerUnit * input.quantity;

  const extraDesignPoints = Math.max(0, input.extraDesignPoints ?? 0);
  const extraDesignTotal =
    extraDesignPoints * EXTRA_DESIGN_POINT_PRICE * input.quantity;

  const longSleeve = Boolean(input.longSleeve && product.supportsLongSleeve);
  const longSleeveCostPerUnit = longSleeve ? product.longSleeveSurcharge : 0;
  const longSleeveTotal = longSleeveCostPerUnit * input.quantity;

  const zipper = Boolean(input.zipper && product.supportsZipper);
  const zipperTotal = zipper ? ZIPPER_SURCHARGE * input.quantity : 0;

  const extraPocketOrReflector = Boolean(input.extraPocketOrReflector);
  const extraPocketTotal = extraPocketOrReflector
    ? EXTRA_POCKET_OR_REFLECTOR_SURCHARGE * input.quantity
    : 0;

  const jumboCounts = {
    XXL: Math.max(0, input.sizeBreakdown?.XXL ?? 0),
    "3XL": Math.max(0, input.sizeBreakdown?.["3XL"] ?? 0),
    "4XL": Math.max(0, input.sizeBreakdown?.["4XL"] ?? 0),
  };

  const sizeTotalEntered = Object.values(input.sizeBreakdown ?? {}).reduce(
    (sum, n) => sum + (typeof n === "number" && n > 0 ? n : 0),
    0,
  );
  if (sizeTotalEntered > 0 && sizeTotalEntered !== input.quantity) {
    warnings.push(
      `Total rincian ukuran (${sizeTotalEntered} pcs) berbeda dengan jumlah pesanan (${input.quantity} pcs). Tambahan ukuran jumbo tetap dihitung sesuai rincian ukuran jumbo yang dimasukkan.`,
    );
  }

  const jumboSurchargeTotal =
    jumboCounts.XXL * JUMBO_SURCHARGES.XXL +
    jumboCounts["3XL"] * JUMBO_SURCHARGES["3XL"] +
    jumboCounts["4XL"] * JUMBO_SURCHARGES["4XL"];

  const totalPrice =
    subtotalBase -
    discountAmount +
    printTotal +
    extraDesignTotal +
    longSleeveTotal +
    zipperTotal +
    extraPocketTotal +
    jumboSurchargeTotal;

  const averageUnitPrice =
    input.quantity > 0 ? Math.round(totalPrice / input.quantity) : 0;
  const dpPercent = 50;
  const dpAmount = Math.round((totalPrice * dpPercent) / 100);
  const remainingAmount = totalPrice - dpAmount;

  const extraDays = input.quantity >= 150 ? 4 : input.quantity >= 80 ? 2 : 0;

  return {
    productId: product.id,
    productName: product.name,
    fabricId: fabric.id,
    fabricName: fabric.name,
    printMethodId: printSpec.id,
    printMethodName: printSpec.name,
    quantity: input.quantity,
    moq: product.moq,
    meetsMoq: input.quantity >= product.moq,
    unitBasePrice,
    subtotalBase,
    discountPercent: tier.discountPercent,
    discountLabel: tier.label,
    discountAmount,
    printCostPerUnit,
    printTotal,
    extraDesignPoints,
    extraDesignCostPerPoint: EXTRA_DESIGN_POINT_PRICE,
    extraDesignTotal,
    longSleeve,
    longSleeveCostPerUnit,
    longSleeveTotal,
    zipper,
    zipperTotal,
    extraPocketOrReflector,
    extraPocketTotal,
    jumboCounts,
    jumboSurchargeTotal,
    totalPrice,
    averageUnitPrice,
    dpPercent,
    dpAmount,
    remainingAmount,
    estimatedDaysMin: product.estimatedDaysMin + extraDays,
    estimatedDaysMax: product.estimatedDaysMax + extraDays,
    sizeBreakdownSummary: formatSizeBreakdown(input.sizeBreakdown),
    warnings,
  };
}

export function getCatalogOverview() {
  const config = getKonveksiConfig();
  return {
    brandName: config.brandName,
    location: config.city,
    products: Object.values(KONVEKSI_PRODUCTS).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      moq: p.moq,
      estimatedWorkDays: `${p.estimatedDaysMin}–${p.estimatedDaysMax} hari kerja`,
      supportsLongSleeve: p.supportsLongSleeve,
      supportsZipper: p.supportsZipper,
      fabrics: p.compatibleFabrics.map((fId) => ({
        id: fId,
        name: KONVEKSI_FABRICS[fId].name,
        gsm: KONVEKSI_FABRICS[fId].gsm,
        basePrice: p.fabricPrices[fId],
      })),
      highlights: p.highlights,
    })),
    fabrics: Object.values(KONVEKSI_FABRICS),
    printMethods: Object.values(PRINT_METHODS),
    discountTiers: DISCOUNT_TIERS,
    jumboSurcharges: JUMBO_SURCHARGES,
    sizeChartSummary: {
      kaosPolo:
        "S (47x67), M (50x70), L (53x73), XL (56x75), XXL (59x77), 3XL (62x80), 4XL (65x82) cm",
      kemejaPdhPdl:
        "S (50x69), M (53x71), L (56x74), XL (59x76), XXL (62x78), 3XL (65x80) cm",
      hoodieJaket:
        "S (52x66), M (55x68), L (58x71), XL (61x73), XXL (64x76), 3XL (67x78) cm",
    },
  };
}

export interface KonveksiOrderDraft {
  orderCode?: string;
  customerName: string;
  organization?: string;
  customerWhatsapp: string;
  productName: string;
  fabricName?: string;
  color?: string;
  quantity: number;
  sizeBreakdownText?: string;
  printMethod?: string;
  designNotes?: string;
  shippingAddress?: string;
  deadlineDate?: string;
  notes?: string;
  estimatedTotal?: number;
  estimatedDp?: number;
  estimatedDays?: string;
}

export function buildWhatsAppOrderMessage(
  order: KonveksiOrderDraft,
  brandName = getKonveksiConfig().brandName,
): string {
  const lines: string[] = [
    `Halo Admin *${brandName}*, saya ingin melakukan pemesanan konveksi dengan detail berikut:`,
    "",
  ];

  if (order.orderCode) {
    lines.push(`*No. Referensi Order:* ${order.orderCode}`);
  }
  lines.push(`*Nama Pemesan:* ${order.customerName || "-"}`);
  if (order.organization) {
    lines.push(`*Instansi / Komunitas:* ${order.organization}`);
  }
  lines.push(`*No. WhatsApp:* ${order.customerWhatsapp || "-"}`);
  lines.push("");
  lines.push("*SPESIFIKASI PESANAN*");
  lines.push(`• Produk: ${order.productName || "-"}`);
  if (order.fabricName) {
    lines.push(`• Bahan Kain: ${order.fabricName}`);
  }
  if (order.color) {
    lines.push(`• Warna Kain: ${order.color}`);
  }
  lines.push(`• Jumlah Total: ${order.quantity || 0} pcs`);
  if (order.sizeBreakdownText) {
    lines.push(`• Rincian Ukuran: ${order.sizeBreakdownText}`);
  }
  if (order.printMethod) {
    lines.push(`• Sablon / Bordir: ${order.printMethod}`);
  }
  if (order.designNotes) {
    lines.push(`• Detail Desain & Posisi: ${order.designNotes}`);
  }

  if (order.estimatedTotal && order.estimatedTotal > 0) {
    lines.push("");
    lines.push("*ESTIMASI BIAYA*");
    lines.push(`• Estimasi Total: ${formatRupiah(order.estimatedTotal)}`);
    if (order.estimatedDp && order.estimatedDp > 0) {
      lines.push(`• Estimasi DP (50%): ${formatRupiah(order.estimatedDp)}`);
    }
    if (order.estimatedDays) {
      lines.push(`• Estimasi Pengerjaan: ${order.estimatedDays}`);
    }
  }

  lines.push("");
  lines.push("*PENGIRIMAN & CATATAN*");
  if (order.deadlineDate) {
    lines.push(`• Target Deadline: ${order.deadlineDate}`);
  }
  lines.push(`• Alamat Pengiriman: ${order.shippingAddress || "-"}`);
  if (order.notes) {
    lines.push(`• Catatan Tambahan: ${order.notes}`);
  }
  lines.push("");
  lines.push("Mohon dibantu konfirmasi ketersediaan bahan, mockup desain, dan invoice DP-nya. Terima kasih!");

  return lines.join("\n");
}

export function buildWhatsAppUrl(
  message: string,
  adminWhatsapp?: string,
): string {
  const number = normalizeWhatsappNumber(
    adminWhatsapp || getKonveksiConfig().whatsappNumber,
  );
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
