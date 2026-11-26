import fs from "node:fs/promises";
import path from "node:path";
import { PineconeVectorStore } from "../src/lib/rag/pinecone-vector-store";

const DOCS = [
  {
    id: "konveksi-bahan-kain",
    title: "Panduan Bahan Kain Konveksi (Gramasi, Karakteristik & Kecocokan)",
    source: "docs/rag/01-panduan-bahan-kain.md",
    file: "docs/rag/01-panduan-bahan-kain.md",
  },
  {
    id: "konveksi-spesifikasi-cetak",
    title: "Spesifikasi Sablon, Bordir, Standar Jahitan & Size Chart",
    source: "docs/rag/02-spesifikasi-cetak-jahitan-size-chart.md",
    file: "docs/rag/02-spesifikasi-cetak-jahitan-size-chart.md",
  },
  {
    id: "konveksi-diskon-sop-promo",
    title: "Skema Diskon, Pembayaran, Garansi, Alur Order, SOP & Promo",
    source: "docs/rag/03-diskon-pembayaran-garansi-sop-promo.md",
    file: "docs/rag/03-diskon-pembayaran-garansi-sop-promo.md",
  },
];

async function main() {
  const store = new PineconeVectorStore();

  for (const doc of DOCS) {
    const content = await fs.readFile(path.resolve(doc.file), "utf-8");
    const saved = await store.upsertDocument({
      id: doc.id,
      title: doc.title,
      source: doc.source,
      content,
    });
    console.log(`Uploaded: ${saved.title} (${saved.chunkCount} chunks)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});