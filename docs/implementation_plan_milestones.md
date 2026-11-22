# Implementation Plan (TASKS): CuanTepat

MVP selesai setelah Fase 6, termasuk ekspor dan sinkronisasi opsional. Selesaikan dan verifikasi satu fase sebelum melangkah ke fase berikutnya.

---

## Fase 1: Setup Proyek & Mesin Matematika (Fondasi)
*Tujuan: Pondasi proyek siap dan seluruh rumus bisnis terbukti akurat 100% lewat unit test.*
- [x] Inisialisasi Next.js (App Router, TypeScript strict, Tailwind CSS v4). Cek: `npm run build`, lalu `npm start` dan jalankan `npm run smoke` di terminal lain.
- [x] Konfigurasi Plus Jakarta Sans, angka tabular, dan palet tema di `src/app/layout.tsx` dan `src/app/globals.css` sesuai [panduan desain](design_system_ui_guidelines.md).
- [x] Pasang `zustand` dan `zod` untuk draf tamu. Komponen native dipakai untuk tab, input, dan panel lipat.
- [x] Buat tipe data inti & skema validasi Zod di `src/types/calculator.ts`.
- [x] Bangun `src/lib/math/unitConverter.ts` untuk massa, volume, dan hitungan. Konversi karton ke satuan lain perlu isi pcs per karton dari kemasan bahan.
- [x] Bangun `src/lib/math/priceRounding.ts` untuk pilihan harga etalase berakhiran 900 tanpa menurunkan harga saran.
- [x] Bangun `src/lib/math/hppEngine.ts` untuk HPP per porsi (susut, overhead, upah, kemasan), saran harga offline/kanal, indikator margin, promo/bundling, dan BEP bulanan/harian.
- [x] Tambahkan simulasi *what-if* kenaikan harga bahan di `hppEngine.ts`.
- [x] Uji rumus dan batas input di `src/lib/math/hppEngine.test.ts` dengan Vitest: `npm test`.

Pada simulator, diskon ditanggung penjual. Komisi dikenakan atas total setelah diskon dan biaya layanan dipotong sekali per pesanan. Margin dihitung terhadap total yang dibayar pembeli; jika pesanan gratis, persentasenya `null`. Untuk BEP resep, kirim penerimaan bersih per porsi beserta **biaya dan jumlah porsi batch utuh**, bukan laba hasil pembagian HPP. Dengan biaya tetap positif dan kontribusi nol/negatif, BEP tidak tercapai (`null`), bukan 0 porsi.

## Fase 2: Core UI — Quick Mode & Guest Persistence
*Tujuan: Pengguna bisa langsung menghitung HPP di halaman depan tanpa login dan datanya tersimpan otomatis di browser.*
- [x] Draf Zustand `persist` dengan contoh *Es Kopi Susu* dan *Ayam Geprek*, serta pilihan resep baru.
- [x] Header di `src/app/page.tsx`, dua kolom di desktop, dan ringkasan tetap di bawah layar ponsel.
- [x] `QuickModeForm.tsx`: tambah, hapus, edit satuan, susut dan isi karton, kemasan, overhead, upah, serta porsi.
- [x] `ResultSummaryCard.tsx`: HPP/porsi, saran harga, laba bersih, indikator margin, dan komposisi modal.
- [x] Teruji di Chrome pada `375px` dan `1280px`: layout, angka tabular, navigasi keyboard, dan reload resep karton + simulasi.

## Fase 3: Mode Pro — Tab Analisis Bisnis Lengkap
*Tujuan: Menghadirkan seluruh fitur perspektif penjualan, pemasaran, dan keuangan tanpa membuat tampilan penuh sesak.*
- [x] `ProTabs.tsx`: empat tab dalam panel yang awalnya tertutup; tab dapat dipilih dengan keyboard.
- [x] Harga Offline, GoFood, GrabFood, ShopeeFood, dan Marketplace dengan tarif yang dapat diedit dan tombol salin.
- [x] Promo persen/nominal per pesanan, laba paket, batas diskon, dan peringatan rugi.
- [x] Target BEP bulanan dan harian, termasuk keadaan tidak mungkin balik modal.
- [x] Slider kenaikan bahan 0–50% dengan HPP dan margin baru pada harga jual yang sama.

## Fase 4: Integrasi AI Multimodal (Foto Struk & Ketik Santai)
*Tujuan: Menghilangkan hambatan input manual menggunakan Gemini API.*
- [ ] Setup `@google/genai` dan konfigurasi `GEMINI_API_KEY` di `.env.local`.
- [ ] Buat prompt & JSON Schema ketat di `src/lib/gemini/parser.ts` agar output AI selalu berupa array bahan baku terstruktur (`name`, `buy_price`, `buy_qty`, `buy_unit`).
- [ ] Buat Route Handler `src/app/api/parse-text/route.ts` untuk input teks santai (gaya chat WA).
- [ ] Buat Route Handler `src/app/api/parse-receipt/route.ts` untuk upload/foto struk belanja (dengan kompresi gambar di client sebelum dikirim agar cepat & hemat kuota).
- [ ] Bangun komponen `MultimodalInput.tsx` (modal/drawer dengan preview hasil ekstraksi agar user bisa mengecek/mencentang bahan sebelum masuk ke kalkulator).
- [ ] Uji error handling: foto buram, teks ngawur, atau koneksi terputus.

## Fase 5: Ekspor Praktis (PDF & WhatsApp)
*Tujuan: Hasil hitungan langsung bisa dipakai di dunia nyata oleh pemilik dan staf dapur.*
- [ ] Buat generator teks ringkas untuk tombol **Salin ke WhatsApp** (format rapi dengan emoji secukupnya).
- [ ] Bangun `RecipePdfDocument.tsx` dengan 2 mode tampilan:
  - [ ] **Versi Pemilik:** Lengkap dengan HPP, margin, harga ojol, dan rincian biaya.
  - [ ] **Versi Dapur/Karyawan:** Hanya nama menu, jumlah porsi, takaran bahan pakai, dan catatan resep (tanpa ada angka Rupiah/profit).
- [ ] Bangun `ExportModal.tsx` untuk memilih versi ekspor dan langsung download PDF atau share WA.

## Fase 6: Cloud Sync (Supabase Auth & Database) + Polish
*Tujuan: Pengguna yang ingin menyimpan banyak resep lintas perangkat bisa login dengan mulus.*
- [ ] Setup proyek Supabase, jalankan migrasi SQL untuk tabel `profiles`, `recipes`, `recipe_ingredients`, `recipe_channels`, dan aktifkan seluruh aturan **RLS** sesuai [kontrak data](database_schema_security.md).
- [ ] Implementasikan Supabase Auth (Google Login / Magic Link) + `SyncBanner.tsx` yang muncul halus saat user sudah membuat resep di Guest Mode.
- [ ] Buat logika migrasi data dari `localStorage` ke Supabase saat user pertama kali login.
- [ ] Bangun halaman `src/app/recipes/page.tsx` untuk melihat, menduplikasi, dan menghapus daftar resep tersimpan.
- [ ] Audit akhir: cek performa Lighthouse, SEO metadata, OpenGraph image, dan deploy ke Vercel.