export interface StarterDocument {
  id: string;
  title: string;
  source: string;
  content: string;
}

export const STARTER_DOCUMENTS: StarterDocument[] = [
  {
    id: "konveksi-katalog-produk",
    title: "Katalog Produk Konveksi, MOQ & Harga Dasar",
    source: "internal://konveksi/katalog-produk",
    content: [
      "Daftar produk yang dapat diproduksi oleh konveksi kami beserta Minimum Order Quantity (MOQ), estimasi waktu kerja, dan harga dasar (belum termasuk diskon grosir):",
      "1. Kaos Oblong / T-Shirt (MOQ 12 pcs, estimasi 7–10 hari kerja): Cotton Combed 30s Rp 50.000/pcs, Combed 24s Rp 55.000/pcs, Combed 20s Rp 62.000/pcs, Cotton Bamboo 30s Rp 68.000/pcs. Lengan panjang +Rp 10.000/pcs.",
      "2. Polo Shirt / Kaos Kerah (MOQ 12 pcs, estimasi 10–14 hari kerja): Lacoste CVC Pique Rp 75.000/pcs, Lacoste Cotton 100% Rp 88.000/pcs, Combed 24s Rp 70.000/pcs. Lengan panjang +Rp 10.000/pcs.",
      "3. Kemeja PDH / Seragam Kantor (MOQ 12 pcs, estimasi 12–16 hari kerja): American Drill 1919 Rp 115.000/pcs, Nagata/Japan Drill Rp 135.000/pcs. Lengan panjang +Rp 12.000/pcs.",
      "4. Kemeja PDL / Lapangan (MOQ 12 pcs, estimasi 14–18 hari kerja): American Drill Rp 125.000/pcs, Ripstop Kotak-Kotak Rp 135.000/pcs, Nagata Drill Rp 145.000/pcs. Lengan panjang +Rp 12.000/pcs.",
      "5. Hoodie / Sweater Pullover (MOQ 12 pcs, estimasi 14–18 hari kerja): Baby Terry Rp 130.000/pcs, Cotton Fleece Rp 145.000/pcs. Opsi resleting (Zipper Hoodie) +Rp 15.000/pcs.",
      "6. Jaket Varsity / Coach / Bomber (MOQ 12 pcs, estimasi 14–21 hari kerja): Taslan/Parasut Micro Rp 170.000/pcs, Cotton Fleece Rp 175.000/pcs, Canvas Marsoto Rp 185.000/pcs.",
      "7. Jersey Olahraga / Futsal / Esports (MOQ 12 pcs, estimasi 10–14 hari kerja): Dryfit Milano/Benzema Rp 85.000/pcs (gratis custom nama & nomor). Lengan panjang +Rp 10.000/pcs.",
      "8. Jas Almamater / Wearpack Safety (MOQ 20 pcs, estimasi 14–21 hari kerja): American Drill Rp 155.000/pcs, Ripstop Rp 170.000/pcs, Nagata Drill Rp 175.000/pcs, Canvas Marsoto Rp 185.000/pcs. Tambahan pita scotlight reflektif/saku khusus +Rp 10.000/pcs.",
      "9. Totebag / Goodiebag Custom (MOQ 24 pcs, estimasi 7–10 hari kerja): American Drill Rp 28.000/pcs, Canvas Marsoto Rp 32.000/pcs. Tambahan resleting +Rp 15.000/pcs.",
    ].join("\n\n"),
  },
  {
    id: "konveksi-bahan-kain",
    title: "Panduan Lengkap Bahan Kain Konveksi",
    source: "internal://konveksi/bahan-kain",
    content: [
      "Berikut karakteristik bahan kain yang tersedia agar pelanggan mudah memilih sesuai kebutuhan acara, kenyamanan, dan anggaran:",
      "• Cotton Combed 30s (140–150 gsm): 100% katun murni, ringan, sangat adem, cocok untuk kaos event, merchandise, dan cuaca panas.",
      "• Cotton Combed 24s (170–185 gsm): Ketebalan sedang paling populer (bestseller), tidak menerawang, tetap sejuk, cocok untuk kaos komunitas & brand.",
      "• Cotton Combed 20s (190–210 gsm): Tebal dan kokoh, awet untuk pemakaian intensif dan potongan oversize/streetwear.",
      "• Cotton Bamboo 30s (150–160 gsm): Serat katun-bambu antibakteri, ekstra lembut dan anti-bau, cocok untuk kaos premium.",
      "• Lacoste CVC Pique & Lacoste Cotton 100% (200–230 gsm): Rajutan berpori segi enam khas polo shirt. CVC lebih tahan kusut, sedangkan Lacoste Cotton 100% lebih adem.",
      "• American Drill 1919 & Nagata/Japan Drill (220–250 gsm): Tenunan diagonal (twill) kuat dan rapi untuk kemeja PDH/PDL, jas almamater, dan totebag. Nagata Drill memiliki kadar katun lebih tinggi sehingga lebih sejuk dan halus.",
      "• Ripstop Kotak-Kotak (200–220 gsm): Berpola kotak penguat anti-sobek, ringan, dan cepat kering untuk seragam lapangan/PDL & wearpack.",
      "• Cotton Fleece (280–330 gsm) & Baby Terry (240–260 gsm): Cotton Fleece berbulu hangat di bagian dalam untuk hoodie/varsity tebal, sedangkan Baby Terry lebih ringan dan adem untuk iklim tropis.",
      "• Taslan / Parasut Micro (140–170 gsm): Tahan angin (windproof) dan tahan percikan air (water-repellent) untuk jaket coach, bomber, dan touring.",
      "• Dryfit Milano / Benzema (150–170 gsm): Pori-pori cepat kering (quick-dry) dan ringan untuk jersey olahraga.",
      "• Canvas Marsoto / Twill (260–300 gsm): Tebal, bertekstur natural dan kuat menahan beban untuk totebag maupun jaket kerja.",
    ].join("\n\n"),
  },
  {
    id: "konveksi-spesifikasi-cetak",
    title: "Spesifikasi Sablon, Bordir, Jahitan & Size Chart",
    source: "internal://konveksi/spesifikasi-produk",
    content: [
      "Spesifikasi aplikasi desain (sablon & bordir) yang ditawarkan konveksi kami:",
      "• Polos: Tanpa sablon/bordir (Rp 0).",
      "• Sablon Rubber (+Rp 10.000/pcs, 1 sisi): Tinta elastis, warna solid, ekonomis untuk kaos acara.",
      "• Sablon DTF Full Color (+Rp 12.000/pcs, 1 sisi): Direct Transfer Film, cocok untuk desain banyak warna, gradasi, foto, dan order satuan/kecil (mulai 12 pcs).",
      "• Sablon Plastisol (+Rp 15.000/pcs, 1 sisi): Standar distro kualitas tinggi, warna sangat tajam dan awet (disarankan minimal 24 pcs).",
      "• Sablon Discharge (+Rp 18.000/pcs, 1 sisi): Tinta meresap ke serat kain katun gelap, terasa halus seperti tanpa sablon (disarankan minimal 24 pcs).",
      "• Bordir Komputer Standar (+Rp 15.000/pcs, 1–2 titik): Jahitan benang presisi untuk logo dada, nama, atau tulisan punggung pada polo, kemeja PDH/PDL, dan jaket.",
      "• Bordir Komputer 3D / Timbul (+Rp 22.000/pcs): Bordir berdimensi tebal atau emblem patch eksklusif.",
      "• Printing Sublimasi Full Body (+Rp 20.000/pcs): Khusus bahan Dryfit/polyester untuk jersey full motif anti-luntur.",
      "• Titik desain tambahan (misal tambahan logo di lengan atau punggung besar selain sisi utama): +Rp 7.500/titik/pcs.",
      "Standar jahitan & finishing: Kaos memakai jahit rantai pundak + overdeck 3 jarum + obras 4 benang; kemeja memakai jahit double stick rapi; saku & hoodie dilengkapi bartack penguat. Opsional aksesoris: resleting YKK (+Rp 15.000/pcs pada hoodie/jaket/tas), saku khusus atau pita scotlight reflektif (+Rp 10.000/pcs).",
      "Size Chart Standar (Lebar Dada x Panjang Badan dalam cm): Kaos/Polo: S (47x67), M (50x70), L (53x73), XL (56x75), XXL (59x77), 3XL (62x80), 4XL (65x82). Kemeja PDH/PDL: S (50x69), M (53x71), L (56x74), XL (59x76), XXL (62x78), 3XL (65x80). Hoodie/Jaket: S (52x66), M (55x68), L (58x71), XL (61x73), XXL (64x76), 3XL (67x78).",
      "Biaya tambahan ukuran Jumbo: XXL +Rp 10.000/pcs, 3XL +Rp 15.000/pcs, 4XL +Rp 20.000/pcs.",
    ].join("\n\n"),
  },
  {
    id: "konveksi-alur-pemesanan",
    title: "Diskon Kuantitas, Pembayaran & Alur Pemesanan WhatsApp",
    source: "internal://konveksi/alur-pemesanan",
    content: [
      "Diskon kuantitas (berlaku pada harga dasar produk): 12–23 pcs harga standar (0%), 24–49 pcs diskon 5%, 50–99 pcs diskon 10%, 100–249 pcs diskon 15%, dan 250+ pcs diskon 20%.",
      "Skema pembayaran & garansi: Pembayaran DP 50% di awal setelah desain/mockup disetujui, pelunasan 50% dilakukan setelah produksi selesai dan foto/video Quality Control (QC) dikirim sebelum barang dikirim. Kami memberikan garansi perbaikan/penggantian apabila terjadi cacat jahitan atau salah ukuran/sablon yang tidak sesuai SPK.",
      "Alur pemesanan melalui AI Agent: (1) Konsultasikan produk, bahan, dan spesifikasi desain; (2) Minta AI Agent menghitung estimasi biaya & waktu produksi; (3) Lengkapi data pemesanan (Nama Pemesan, Instansi/Komunitas, No. WhatsApp aktif, Produk, Bahan, Warna, Jumlah & Rincian Ukuran S–4XL, Sablon/Bordir, Alamat Pengiriman, dan Target Deadline); (4) Simpan data pesanan dan klik tombol Forward ke WhatsApp untuk mengirim format SPK langsung ke Admin Konveksi.",
    ].join("\n\n"),
  },
];
