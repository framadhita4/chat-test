# Dokumen Panduan & Mockup Pengumpulan Data — Model ML Rekomendasi Bahan & Paket Konveksi

Dokumen ini disusun sebagai panduan standar bagi tim lapangan saat berkunjung langsung ke **tempat usaha konveksi mitra**. Data yang dikumpulkan akan digunakan untuk dua kebutuhan utama dalam sistem AI Agent Konveksi:

1. **Melatih Model Machine Learning (Non-LLM) — _Package & Fabric Recommender_**: Memberikan rekomendasi kombinasi **Produk + Bahan Kain + Metode Sablon/Bordir** terbaik berdasarkan profil kebutuhan dan anggaran pelanggan.
2. **Menyinkronkan Knowledge Base (RAG) & Kalkulator Harga**: Memastikan harga, MOQ, pilihan bahan, dan estimasi waktu pengerjaan di sistem sesuai dengan kondisi riil tempat usaha konveksi.

---

## 1. Peran Model ML di Pipeline Workflow Konveksi

Calon pelanggan konveksi sering kali tidak mengetahui istilah teknis garmen (misalnya perbedaan _Cotton Combed 24s_ vs _30s_, _American Drill_ vs _Nagata Drill_ vs _Ripstop_, atau _DTF_ vs _Plastisol_ vs _Bordir_). Pelanggan umumnya hanya mengetahui:

- Acara / tujuan pemakaian,
- Jumlah pesanan (`quantity`),
- Anggaran maksimal per pcs (`budget_per_pcs`),
- Lingkungan pemakaian (_indoor_, _outdoor_ panas, lapangan berat, berangin/hujan),
- Jenis desain dan target waktu selesai.

**Alur integrasi ke AI Agent:**

1. Pelanggan berkonsultasi di chat mengenai kebutuhan dan budget-nya.
2. AI Agent memanggil **Model ML Rekomendasi Bahan & Paket** untuk memprediksi **Top-3 paket terbaik** (`product_id | fabric_id | print_method`) beserta skor kecocokannya.
3. AI Agent meneruskan rekomendasi tersebut ke kalkulator harga (`calculateKonveksiQuote`) untuk menampilkan rincian estimasi biaya & DP 50%, lalu mengarahkan ke pengisian form order WhatsApp (`prepareKonveksiOrder`).

---

## 2. Target & Sumber Data di Tempat Usaha Konveksi

Tim lapangan perlu mengumpulkan **3 keluaran data** dalam 1 kali kunjungan:

| No  | File / Template                                                            | Sumber di Lokasi                                                        | Target Minimal                                      | Kegunaan                                                             |
| :-- | :------------------------------------------------------------------------- | :---------------------------------------------------------------------- | :-------------------------------------------------- | :------------------------------------------------------------------- |
| 1   | [master_katalog_konveksi.csv](./templates/master_katalog_konveksi.csv)     | Wawancara pemilik/admin + daftar harga cetak/jahit resmi                | Seluruh varian produk & bahan yang dijual           | Sinkronisasi harga riil, MOQ, & RAG Knowledge Base                   |
| 2   | [dataset_rekomendasi_paket.csv](./templates/dataset_rekomendasi_paket.csv) | Arsip nota/invoice/SPK transaksi 3–12 bulan terakhir + konfirmasi admin | **150–300 baris** transaksi (seimbang antar produk) | Data latih (_training_) & uji (_testing_) model ML                   |
| 3   | Catatan Aturan Pakar & _Size Chart_                                        | Wawancara singkat tukang pola / owner (Bagian 4 di bawah)               | 1 dokumen ringkas                                   | Validasi logika bisnis & _rule-guided augmentation_ bila nota kurang |

> **Aturan Privasi Data (Wajib Dipatuhi):**  
> **Jangan** menyalin nama lengkap pelanggan, nomor WhatsApp pribadi, atau alamat rumah dari nota/SPK ke dalam dataset ML. Gunakan kode anonim seperti `TRX-001`, `TRX-002`, dst.

---

## 3. Kamus Data (_Data Dictionary_) & Kode Nilai Baku

Agar data dari lapangan bisa langsung dibaca oleh script training Python tanpa error ketik (_typo_), tim wajib menggunakan **kode baku** berikut saat mengisi CSV.

### A. Kamus Kolom `dataset_rekomendasi_paket.csv`

| Nama Kolom              | Tipe     |  Wajib   | Kode Nilai Baku / Format                                                                                                                 | Penjelasan                                                |
| :---------------------- | :------- | :------: | :--------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| `order_ref`             | String   |    Ya    | `TRX-001`, `TRX-002`, ...                                                                                                                | ID unik anonim untuk tiap transaksi                       |
| `budget_per_pcs`        | Integer  |    Ya    | Angka Rupiah tanpa titik (mis. `75000`)                                                                                                  | Estimasi anggaran maksimal per pcs yang diminta pelanggan |
| `quantity`              | Integer  |    Ya    | Angka bulat >= 1 (mis. `50`)                                                                                                             | Total jumlah pesanan (pcs)                                |
| `use_case`              | Kategori |    Ya    | `event_panitia`, `komunitas`, `kantor_formal`, `lapangan_outdoor`, `olahraga`, `merchandise_seminar`, `brand_clothing`, `kampus_sekolah` | Tujuan utama penggunaan produk                            |
| `environment`           | Kategori |    Ya    | `indoor_ac`, `outdoor_panas`, `hujan_angin`, `lapangan_berat`                                                                            | Kondisi lokasi pemakaian dominan                          |
| `design_complexity`     | Kategori |    Ya    | `polos`, `logo_teks_sederhana`, `full_color_gradasi`, `full_print_motif`                                                                 | Tingkat kerumitan desain/grafis yang diminta              |
| `priority`              | Kategori |    Ya    | `hemat_biaya`, `adem_nyaman`, `awet_kokoh`, `tampilan_eksklusif`                                                                         | Pertimbangan paling utama bagi pelanggan                  |
| `target_days`           | Integer  |    Ya    | Angka hari kerja (mis. `14`)                                                                                                             | Selisih hari kerja dari deal hingga target jadi           |
| `long_sleeve`           | Boolean  |    Ya    | `0` (pendek) atau `1` (panjang)                                                                                                          | Apakah pesanan menggunakan lengan panjang                 |
| `product_id`            | Kategori |    Ya    | Lihat daftar `product_id` di bawah                                                                                                       | Produk akhir yang dipilih & diproduksi                    |
| `fabric_id`             | Kategori |    Ya    | Lihat daftar `fabric_id` di bawah                                                                                                        | Bahan kain akhir yang dipilih & diproduksi                |
| `print_method`          | Kategori |    Ya    | Lihat daftar `print_method` di bawah                                                                                                     | Metode cetak/bordir akhir yang dipilih                    |
| `actual_unit_price_idr` | Integer  |    Ya    | Angka Rupiah tanpa titik (mis. `69500`)                                                                                                  | Harga riil per pcs yang disepakati di nota                |
| `repeat_order`          | Boolean  | Opsional | `1` (pernah pesan ulang) atau `0`                                                                                                        | Indikator kecocokan/kepuasan historis                     |
| `recommended_package`   | String   |    Ya    | `{product_id}\|{fabric_id}\|{print_method}`                                                                                              | **Target Label (y)** yang diprediksi oleh model ML        |

### B. Daftar Kode Baku Produk, Bahan & Metode Cetak

- **`product_id`**:
  - `kaos-oblong` (Kaos Oblong / T-Shirt)
  - `polo-shirt` (Polo Shirt / Kaos Kerah)
  - `kemeja-pdh` (Kemeja PDH / Seragam Kantor)
  - `kemeja-pdl` (Kemeja PDL / Lapangan)
  - `hoodie` (Hoodie / Sweater / Zipper)
  - `jaket-varsity` (Jaket Varsity / Coach / Bomber)
  - `jersey-printing` (Jersey Olahraga / Futsal / Esports)
  - `almamater-wearpack` (Jas Almamater / Wearpack Safety)
  - `totebag` (Totebag / Goodiebag Custom)

- **`fabric_id`**:
  - Kaos: `combed-30s`, `combed-24s`, `combed-20s`, `cotton-bamboo`
  - Polo: `lacoste-cvc`, `lacoste-cotton` (bisa juga `combed-24s`)
  - Kemeja & Wearpack: `american-drill`, `nagata-drill`, `ripstop`
  - Hoodie & Jaket: `cotton-fleece`, `baby-terry`, `taslan-balon`
  - Jersey: `dryfit-milano`
  - Totebag / Kanvas: `canvas-marsoto`, `american-drill`

- **`print_method`**:
  - `polos` (Tanpa sablon/bordir)
  - `sablon-rubber`
  - `sablon-dtf`
  - `sablon-plastisol`
  - `sablon-discharge`
  - `bordir-standar`
  - `bordir-timbul`
  - `full-sublim`

_(Jika di tempat usaha konveksi ada produk/bahan tambahan di luar daftar di atas, misal `combed-24s-heavyweight` atau `japan-drill-verlando`, catat dengan format huruf kecil + tanda hubung `-` secara konsisten di semua baris.)_

---

## 4. Panduan Wawancara di Lokasi (Checklist Pertanyaan ke Owner / Admin)

Gunakan daftar pertanyaan ini selama 30–45 menit wawancara bersama pemilik atau admin konveksi:

1. **Katalog & Harga Riil (`master_katalog_konveksi.csv`)**:
   - Produk apa saja yang paling sering diproduksi dan berapa minimal order (MOQ) per produk?
   - Bahan kain apa saja yang stoknya selalu tersedia dan mana yang harus _pre-order_ roll kain?
   - Berapa harga dasar tiap kombinasi produk + bahan, dan bagaimana skema diskon kuantitasnya (misal per 24, 50, 100, 250 pcs)?
   - Berapa biaya tambahan untuk lengan panjang, resleting, saku/scotlight, titik sablon/bordir ekstra, serta ukuran jumbo (`XXL`, `3XL`, `4XL`)?
2. **Aturan Pakar untuk Rekomendasi Bahan & Sablon**:
   - Jika pelanggan punya budget pas-pasan untuk acara panitia 1 hari di luar ruangan, bahan & sablon apa yang biasanya direkomendasikan?
   - Kapan Anda menyarankan **Sablon DTF** dibanding **Sablon Plastisol** atau **Rubber**? (Misal: jumlah < 24 pcs atau desain banyak warna/gradasi?)
   - Untuk seragam kerja indoor vs lapangan outdoor, kapan harus memilih **American Drill**, **Nagata Drill**, atau **Ripstop**?
   - Untuk daerah panas/tropis, kapan pelanggan disarankan **Baby Terry** dibanding **Cotton Fleece**?
3. **Kapasitas & Lead Time**:
   - Berapa hari kerja normal penyelesaian masing-masing produk, dan berapa tambahannya saat _peak season_ (menjelang 17 Agustus, ospek kampus, atau Ramadhan)?
   - Berapa persen DP awal dan bagaimana mekanisme pelunasan serta garansi cacat produksi?
4. **Kontak & Operasional Chatbot**:
   - Nomor WhatsApp resmi admin yang akan menerima _forward_ pesanan dari AI Chatbot?

---

## 5. Penjelasan Contoh Mockup Data (`templates/`)

File template siap isi telah disediakan di folder `docs/templates/`:

- [dataset_rekomendasi_paket.csv](./templates/dataset_rekomendasi_paket.csv) — berisi 20 contoh baris simulasi transaksi lintas 9 kategori produk.
- [master_katalog_konveksi.csv](./templates/master_katalog_konveksi.csv) — berisi 20 contoh baris master harga, MOQ, dan catatan rekomendasi pemilik usaha.

### Cara Membaca Contoh Baris di Mockup Dataset

- **Contoh Kasus Hemat & Desain Full Color (`TRX-001`)**:  
  Budget `65.000`, qty `80`, acara `event_panitia`, lingkungan `outdoor_panas`, desain `full_color_gradasi`, prioritas `hemat_biaya` → paket terpilih: **`kaos-oblong|combed-30s|sablon-dtf`** (karena Combed 30s ringan/ekonomis di cuaca panas, dan DTF paling efisien untuk desain full color).
- **Contoh Kasus Kantor Formal (`TRX-005`)**:  
  Budget `150.000`, qty `30`, acara `kantor_formal`, lingkungan `indoor_ac`, desain `logo_teks_sederhana`, prioritas `tampilan_eksklusif` → paket terpilih: **`kemeja-pdh|nagata-drill|bordir-standar`** (Nagata Drill lebih halus & rapi untuk seragam kantor + bordir komputer).
- **Contoh Kasus Lapangan Berat (`TRX-007`)**:  
  Budget `160.000`, qty `25`, acara `lapangan_outdoor`, lingkungan `lapangan_berat`, prioritas `awet_kokoh` → paket terpilih: **`kemeja-pdl|ripstop|bordir-standar`** (Ripstop anti-sobek untuk medan lapangan).

---

## 6. Checklist Kualitas Data Sebelum Diserahkan ke Tim ML

Sebelum file CSV dikembalikan dari lapangan ke tim pengembang ML, pastikan:

- [ ] Minimal terkumpul **150 transaksi** pada `dataset_rekomendasi_paket.csv` (idealnya tiap kombinasi `recommended_package` utama muncul minimal 8–10 kali).
- [ ] Tidak ada sel kosong (_missing value_) pada kolom wajib (`budget_per_pcs`, `quantity`, `use_case`, `environment`, `design_complexity`, `priority`, `recommended_package`).
- [ ] Semua harga dan angka sudah berupa angka murni tanpa huruf/titik (`75000`, bukan `Rp 75.000`).
- [ ] Penulisan kategori sudah sesuai kamus data di Bagian 3 (huruf kecil, tanpa spasi berlebih).
- [ ] Semua data sensitif pelanggan (nama asli, nomor HP, alamat) sudah dihapus/dianonimkan.
