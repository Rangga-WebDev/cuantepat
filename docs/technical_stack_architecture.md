# Technical Stack & Architecture: CuanTepat

Dokumen ini menjadi batasan teknis ketat agar seluruh kode tetap konsisten, ringan, modern, dan bebas dari konflik *library*.

## 1. Core Framework & Bahasa
* **Framework:** Next.js 15+ (App Router, React Server Components & Server Actions).
* **Bahasa:** TypeScript (Strict Mode wajib aktif).
* **Styling:** Tailwind CSS v4 (atau v3.4+ dengan `clsx` dan `tailwind-merge`).
* **Komponen UI:** shadcn/ui (berbasis Radix UI) untuk aksesibilitas dan kontrol penuh atas desain.
* **Ikon:** `lucide-react`.

## 2. State Management, Validasi & Utilitas
* **Form & Validasi:** `react-hook-form` + `zod` (skema validasi tunggal untuk frontend & backend).
* **Client State & Persistence:** `zustand` dengan middleware `persist` ke `localStorage` (kunci utama fitur *Zero-Friction Guest Mode*).
* **Ekspor PDF:** `@react-pdf/renderer` atau `html2canvas` + `jspdf` (dipilih `@react-pdf/renderer` agar teks tajam dan ringan di mobile).
* **Format Angka/Mata Uang:** `Intl.NumberFormat('id-ID')` bawaan JavaScript (jangan instal library tambahan yang tidak perlu).

## 3. Backend, Database & Autentikasi
* **Database:** Supabase (PostgreSQL).
* **Autentikasi:** Supabase Auth (Google OAuth & Magic Link Email) — bersifat opsional untuk sinkronisasi cloud.
* **ORM / Query Client:** `@supabase/ssr` dan `@supabase/supabase-js` dengan tipe data yang di-generate langsung dari skema Postgres.

## 4. Integrasi AI (Multimodal Input)
* **Provider:** Google Gemini API (`@google/genai` SDK resmi terbaru).
* **Model:** `gemini-2.5-flash` (optimal untuk kecepatan tinggi, biaya rendah, dan akurasi OCR struk belanja + parsing teks bahasa Indonesia).
* **Aturan Penting:** AI **hanya** digunakan untuk ekstraksi data tidak terstruktur (foto struk / teks santai) menjadi JSON terstruktur (menggunakan *Structured Outputs* / JSON Schema). AI **dilarang** melakukan kalkulasi HPP atau harga jual.
* **Keamanan API:** Semua pemanggilan Gemini API wajib melalui Next.js Route Handlers (`/api/parse-receipt` dan `/api/parse-text`) agar `GEMINI_API_KEY` tidak pernah terekspos ke browser, dilengkapi *rate-limiting* sederhana.

## 5. Hosting & Deployment
* **Platform:** Vercel (Next.js) + Supabase Cloud (Region: Singapore `ap-southeast-1` agar latensi rendah untuk pengguna Indonesia).

## 6. Struktur Folder Proyek
```text
src/
├── app/
│   ├── layout.tsx                 # Root layout, fonts, metadata
│   ├── page.tsx                   # Halaman utama (Quick Mode + Pro Tabs)
│   ├── recipes/                   # Daftar resep tersimpan (Local & Cloud)
│   │   └── page.tsx
│   ├── auth/
│   │   └── callback/route.ts      # Supabase Auth callback
│   └── api/
│       ├── parse-receipt/route.ts # Endpoint OCR foto struk via Gemini
│       └── parse-text/route.ts    # Endpoint parsing teks chat via Gemini
├── components/
│   ├── ui/                        # Komponen dasar shadcn/ui
│   ├── calculator/
│   │   ├── QuickModeForm.tsx      # Input bahan, kemasan, porsi
│   │   ├── MultimodalInput.tsx    # Modal/Drawer upload foto & ketik santai
│   │   ├── ResultSummaryCard.tsx  # Kartu HPP, margin health, saran harga
│   │   └── pro-tabs/
│   │       ├── MultiChannelTab.tsx
│   │       ├── PromoSimulatorTab.tsx
│   │       ├── BepCalculatorTab.tsx
│   │       └── WhatIfSliderTab.tsx
│   ├── export/
│   │   ├── ExportModal.tsx        # Pilih versi Pemilik / Dapur
│   │   └── RecipePdfDocument.tsx  # Template PDF
│   └── layout/
│       ├── Navbar.tsx
│       └── SyncBanner.tsx         # Ajak login halus jika data masih lokal
├── lib/
│   ├── math/
│   │   ├── hppEngine.ts           # Pure functions: semua rumus HPP, BEP, Promo
│   │   ├── unitConverter.ts       # Konversi kg/g, l/ml, lusin/pcs
│   │   ├── priceRounding.ts       # Pembulatan harga psikologis (x900 / x500)
│   │   └── hppEngine.test.ts      # Unit test wajib (Vitest)
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── gemini/
│   │   └── parser.ts              # Prompt & JSON Schema untuk Gemini API
│   └── utils.ts                   # cn(), formatRupiah()
├── store/
│   └── useCalculatorStore.ts      # Zustand store + localStorage persist
└── types/
    ├── calculator.ts              # Interface & Zod schemas
    └── database.ts                # Generated Supabase types
```