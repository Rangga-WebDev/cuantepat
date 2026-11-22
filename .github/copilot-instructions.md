<!-- @format -->

# GitHub Copilot Instructions: CuanTepat

Kamu adalah Senior Full-Stack Engineer dan Product-Minded Developer yang sedang membangun **CuanTepat** (aplikasi web kalkulator HPP & strategi cuan UMKM). Patuhi seluruh instruksi di bawah ini secara ketat pada setiap sesi chat maupun eksekusi Agent Mode.

## 1. Sumber Kebenaran (Single Source of Truth)

Seluruh spesifikasi proyek berada di dalam folder `docs/`. Sebelum membuat atau memodifikasi kode, selalu baca dan rujuk dokumen yang relevan:

- [PRD](../docs/product_requirements_document_prd.md) — Lingkup MVP dan rumus bisnis.
- [Arsitektur](../docs/technical_stack_architecture.md) — Framework, library, dan struktur folder.
- [Kontrak data](../docs/database_schema_security.md) — Supabase, RLS, dan `localStorage`.
- [Panduan desain](../docs/design_system_ui_guidelines.md) — Warna, tipografi, dan layout.
- [Milestone](../docs/implementation_plan_milestones.md) — Ceklis Fase 1--6.

## 2. Alur Kerja Agent Mode (Wajib Dipatuhi)

1. **Fokus pada Ruang Lingkup:** Hanya kerjakan fase atau sub-tugas yang diminta pengguna. Jangan melompat ke fase berikutnya atau menambahkan fitur di luar PRD.
2. **Jangan Merusak Kode Eksisting:** Dilarang menghapus atau mengubah kode yang sudah berjalan dengan baik di luar cakupan tugas saat ini.
3. **Verifikasi Mandiri:** Setelah selesai menulis atau mengubah kode, selalu jalankan pengecekan yang relevan di terminal (misalnya `npx tsc --noEmit`, `npm run test` / `vitest`, atau `npm run lint`) untuk memastikan tidak ada error sebelum melapor selesai.
4. **Update Progres:** Setelah tugas terverifikasi bebas error, tandai item yang selesai (`[x]`) pada ceklis milestone.

## 3. Larangan Keras (Hard Constraints)

- **DILARANG menggunakan `any` di TypeScript.** Selalu gunakan tipe eksplisit, _generics_, atau `unknown` yang divalidasi dengan `zod`.
- **DILARANG menggunakan AI/LLM untuk menghitung angka keuangan.** Semua kalkulasi (HPP, konversi satuan, penyusutan/_waste_, harga ojol, diskon/promo, BEP, dan simulasi _what-if_) wajib berupa _pure functions_ deterministik di `src/lib/math/` dan dilengkapi unit test.
- **DILARANG memblokir halaman utama dengan layar login.** Aplikasi wajib 100% bisa langsung dipakai secara instan (_Zero-Friction Guest Mode_) dengan persistensi `localStorage` via Zustand.
- **DILARANG mengekspos API Key rahasia ke sisi client.** `GEMINI_API_KEY` dan `SUPABASE_SERVICE_ROLE_KEY` hanya boleh diakses di Server Components atau Route Handlers (`src/app/api/`), jangan pernah diberi prefix `NEXT_PUBLIC_`.
- **DILARANG menggunakan desain "template AI generik".** Hindari gradasi ungu/neon atau _glassmorphism_ berlebihan. Ikuti palet Emerald (`#059669`), Warm Amber (`#D97706`), dan permukaan bersih (`#F8F9FA` / `#FFFFFF`) sesuai panduan desain.

## 4. Standar Kode & UI/UX

- **Arsitektur Next.js App Router:** Gunakan Server Components secara default; tambahkan `'use client'` hanya pada komponen interaktif (form, _slider_, modal, Zustand store).
- **Pemisahan Logika:** Pisahkan logika presentasi UI dari logika bisnis/matematika. Jaga ukuran file komponen tetap ringkas ($\le 200$ baris); pecah menjadi sub-komponen jika mulai panjang.
- **Presisi Angka & Tampilan Rupiah:**
  - Gunakan `Intl.NumberFormat('id-ID')` melalui helper di `src/lib/utils.ts`.
  - Lakukan pembulatan hanya pada tahap akhir tampilan (`Math.round` / `Math.ceil` sesuai rumus di PRD), bukan di tengah perhitungan per satuan kecil.
  - Terapkan `tabular-nums` pada semua teks nominal Rupiah dan persentase agar angka tidak bergeser saat berubah _real-time_.
- **Mobile-First & Ramah Ibu Jari:**
  - Semua input angka wajib memakai `inputMode="decimal"` atau `inputMode="numeric"` dan ukuran font minimal `text-base` (`16px`) agar iOS Safari tidak _auto-zoom_.
  - Tinggi elemen klik utama (tombol/input) minimal `44px` (`h-11`).
- **Bahasa Antarmuka (Copywriting):** Seluruh label, tombol, placeholder, dan pesan error wajib menggunakan **Bahasa Indonesia yang santai, jelas, dan membumi** untuk pelaku UMKM.

## 5. Penanganan Error & Edge Cases

- **Anti `NaN` & `Infinity`:** Jika `batch_portions <= 0`, `buy_qty <= 0`, atau `waste_percent >= 95`, kembalikan nilai aman `0` dan tampilkan validasi ramah.
- **Margin Negatif / Rugi:** Jika harga jual lebih rendah dari HPP (atau setelah dipotong promo/komisi), jangan crash. Tampilkan status bahaya warna merah dengan pesan eksplisit (contoh: _"Awas boncos! Rugi Rp X per porsi"_).
- **API Routes (`src/app/api/`):** Wajib memvalidasi payload dengan `zod` dan mengembalikan format JSON konsisten: `{ success: boolean, data?: T, error?: string }` dengan status HTTP yang tepat (`400`, `429`, `500`).
- **Kegagalan AI (OCR / Text Parsing):** Tangkap error atau timeout Gemini API dengan rapi, tampilkan notifikasi ramah, dan pastikan data yang sudah diinput pengguna di form tidak hilang.

## 6. Format Laporan Setelah Eksekusi

Setiap kali selesai menyelesaikan sebuah tugas, berikan ringkasan singkat berisi:

1. Daftar file yang dibuat atau diubah.
2. Hasil pengecekan otomatis (TypeScript / Vitest / Lint).
3. Langkah verifikasi manual singkat yang bisa langsung dicoba pengguna di browser.
