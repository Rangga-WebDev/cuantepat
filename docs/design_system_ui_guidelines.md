# Design System & UI Guidelines: CuanTepat

Panduan visual ini dirancang agar **CuanTepat** terasa seperti alat kerja modern yang bersih, hangat, dan terpercaya—**bukan** seperti "template AI generik" yang penuh gradasi ungu/neon atau *dashboard* akuntansi yang kaku.

## 1. Filosofi Visual
* **Clean Pragmatism:** Mengutamakan keterbacaan angka dan kecepatan input. Setiap elemen di layar harus punya fungsi nyata.
* **Mobile-First, Thumb-Friendly:** 80%+ pelaku UMKM mengakses dari HP sambil berada di dapur atau pasar. Tombol utama dan input harus nyaman dijangkau ibu jari (tinggi minimal `44px`).
* **Anti-Intimidasi:** Menghindari tabel padat berjejer ke samping di layar HP. Gunakan sistem kartu (*card-based rows*) yang rapi.

## 2. Palet Warna (Hex Code)

### Warna Dasar (*Neutrals*)
* **Canvas Background:** `#F8F9FA` (Abu-abu sangat muda, tidak menyilaukan mata seperti putih murni `#FFFFFF`)
* **Surface / Card:** `#FFFFFF` dengan border halus `1px solid #E5E7EB`
* **Text Primary:** `#111827` (Charcoal gelap untuk kontras tajam)
* **Text Secondary / Label:** `#6B7280` (Abu-abu netral)

### Warna Merek (*Brand Accents*)
* **Primary Action (Emerald Bisnis):** `#059669` (Hover: `#047857`) — Memberi kesan finansial yang sehat, tumbuh, dan tenang.
* **Secondary / Highlight (Warm Amber):** `#D97706` (Background soft: `#FEF3C7`) — Untuk fitur AI (*Scan Struk*) dan tips cerdas.

### Warna Semantik (*Margin Health Check*)
* **Sehat / Aman (Margin $>30\%$):** Text `#065F46`, Background `#D1FAE5`, Border `#6EE7B7`
* **Waspada / Standar (Margin $15\% - 30\%$):** Text `#92400E`, Background `#FEF3C7`, Border `#FCD34D`
* **Bahaya / Rawan Boncos (Margin $<15\%$ atau Negatif):** Text `#991B1B`, Background `#FEE2E2`, Border `#FCA5A5`

## 3. Tipografi
* **Font Utama (UI & Heading):** `Plus Jakarta Sans` (modern, ramah, sangat jelas di layar kecil).
* **Font Angka & Nominal (Wajib):** `JetBrains Mono` atau mengaktifkan CSS `font-variant-numeric: tabular-nums` pada `Plus Jakarta Sans`.
  * *Alasan:* Agar deretan angka Rupiah selalu sejajar rapi secara vertikal saat berubah *real-time* (tidak "goyang" saat *slider* digeser).
* **Skala Ukuran:**
  * Angka HPP / Harga Jual Utama: `28px` -- `32px` (`font-bold`)
  * Judul Seksi: `18px` (`font-semibold`)
  * Body & Input: `16px` (wajib minimal `16px` di input agar iOS Safari tidak *auto-zoom* saat mengetik).
  * Label / Helper Text: `13px` (`text-gray-500`)

## 4. Gaya Komponen
* **Border Radius:** `rounded-xl` (`12px`) untuk kartu utama, `rounded-lg` (`8px`) untuk input dan tombol.
* **Elevasi / Bayangan:** Gunakan shadow sangat tipis (`shadow-xs` atau `shadow-sm`) dipadukan dengan border tegas. Hindari *glassmorphism* berlebihan atau *drop-shadow* tebal yang membuat teks angka sulit dibaca di luar ruangan.
* **Input Angka:** Selalu tampilkan prefix `Rp` atau suffix `%` / `porsi` di dalam kotak input (*input adornment*), dan gunakan `inputMode="decimal"` atau `inputMode="numeric"` agar HP otomatis memunculkan keyboard angka.

## 5. Struktur Layout (*Progressive Disclosure*)

### Tampilan Mobile (`< 768px`)
1. **Top Bar Ringkas:** Logo CuanTepat + Tombol `Resep Saya` + Status Simpan (Lokal/Cloud).
2. **Hero Action Bar:** 2 tombol mencolok tapi rapi: `[📷 Foto Struk]` dan `[✨ Ketik Santai]` + tautan kecil *"Coba Contoh Resep"*.
3. **Quick Mode Form:** Daftar bahan (tiap bahan adalah kartu ringkas yang bisa di-expand untuk atur *waste %*), Biaya Kemasan, Biaya Overhead (collapsible), Jumlah Porsi.
4. **Sticky Bottom Summary Bar:** Melayang tipis di bawah layar HP menampilkan **HPP/Porsi** & **Saran Harga** secara *real-time* saat user masih mengisi bahan, dengan tombol panah ke atas untuk melihat detail lengkap.
5. **Pro Mode Tabs (Di bawah hasil utama):** Tab horizontal *scrollable*: `📱 Harga Ojol` | `🏷️ Cek Promo` | `📊 Target BEP` | `📈 Simulasi Naik Harga`.

### Tampilan Desktop (`>= 1024px`)
* **Layout 2 Kolom (60% Kiri / 40% Kanan):**
  * **Kiri:** Form Input Bahan, Kemasan, Overhead, dan Tab Mode Pro.
  * **Kanan (`position: sticky`):** Kartu Hasil Ringkasan HPP, Indikator Kesehatan Margin, Grafik Komposisi Modal (Bahan vs Kemasan vs Overhead), dan Tombol Ekspor (PDF / WA).