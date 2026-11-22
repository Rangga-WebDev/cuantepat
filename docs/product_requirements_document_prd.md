# Product Requirements Document (PRD): CuanTepat

## 1. Ringkasan Produk
**CuanTepat** adalah aplikasi web utilitas ringan (*micro-web*) berbasis *zero-friction* untuk membantu pelaku UMKM, pebisnis kuliner rumahan, dan penjual *online* menghitung Harga Pokok Penjualan (HPP) secara akurat, menentukan harga jual di berbagai kanal (*offline*, ojol, *marketplace*), serta mensimulasikan promo dan titik impas (*Break-Even Point*) tanpa perlu membuat rumus Excel dari nol.

## 2. Masalah yang Diselesaikan
1. **Fobia Excel & Malas Input Data:** Pebisnis kecil sering menebak harga jual karena proses mencatat resep dan konversi satuan terlalu rumit.
2. **Untung Semu (*Silent Loss*):** Lupa menghitung biaya tersembunyi (*overhead* seperti gas, listrik, kemasan, gaji sendiri) dan faktor penyusutan bahan (*yield/waste factor*).
3. **Salah Harga di Aplikasi Pesan-Antar:** Menyamakan harga *offline* dengan harga di GoFood/GrabFood/ShopeeFood sehingga profit tergerus komisi 20--30%.
4. **Promo Asal-asalan:** Memberikan diskon atau *bundling* tanpa mengetahui batas aman (*batas boncos*).

## 3. Target Pengguna
* **Primer:** Pemilik UMKM kuliner/minuman skala mikro-kecil, pebisnis rumahan (*home-based F&B*), dan penjual *online* pemula.
* **Sekunder:** Mahasiswa/komunitas yang menjalankan usaha *danus* (dana usaha) atau *pre-order* (PO) mingguan.

## 4. Ruang Lingkup Fitur (MVP vs Nice-to-Have)

### A. Must-Have (MVP — selesai setelah Fase 6)
1. **Zero-Friction Guest Mode:** Bisa langsung menghitung di halaman utama tanpa wajib *login*. Data otomatis tersimpan di `localStorage` browser.
2. **Progressive Disclosure UI (2 Mode):**
   * **Mode Cepat (*Quick Mode*):** Input bahan baku, kemasan, dan jumlah porsi $\rightarrow$ langsung keluar HPP per porsi, saran harga jual, dan indikator kesehatan margin.
   * **Mode Pro (*Expandable Tabs*):** Tab analisis lanjutan yang dibuka sesuai kebutuhan.
3. **Input Multimodal (AI-Assisted):**
   * Foto struk belanja (OCR via Gemini API) $\rightarrow$ otomatis diekstrak menjadi daftar bahan, kuantitas, dan harga.
   * Input teks santai (*natural language*, contoh: *"tepung 1kg 14rb, telur 1kg 28rb"*).
4. **Mesin Perhitungan Akurat (Deterministic Math Engine):**
   * Auto-konversi satuan (kg $\leftrightarrow$ gram, liter $\leftrightarrow$ ml, lusin/karton $\leftrightarrow$ pcs).
   * Faktor Penyusutan (*Yield/Waste Factor*) per bahan.
   * Slot Biaya Siluman (*Overhead*: kemasan, gas/listrik, alokasi gaji pemilik).
5. **Simulator Harga Multi-Channel:** Menghitung harga jual optimal untuk *Offline*, GoFood/GrabFood/ShopeeFood (dengan input % komisi + biaya layanan), dan *Marketplace*, lengkap dengan saran pembulatan harga psikologis (misal Rp18.350 $\rightarrow$ Rp18.900).
6. **Kalkulator Promo & Batas Boncos:** Simulasi diskon persentase atau nominal untuk melihat sisa profit bersih secara *real-time*.
7. **Kalkulator BEP Harian:** Input biaya tetap bulanan (sewa, Wi-Fi, gaji staf) $\rightarrow$ target penjualan porsi per hari agar balik modal.
8. **Simulasi *What-If* Kenaikan Bahan:** *Slider* kenaikan harga bahan baku (0% sampai +50%) untuk menguji ketahanan margin.
9. **Indikator Kesehatan Margin:** Status visual otomatis: Merah ($<15\%$), Kuning ($15\% - 30\%$), Hijau ($>30\%$).
10. **Ekspor Ringkasan:** Ekspor ke PDF atau salin teks rapi ke WhatsApp dengan 2 versi: **Versi Pemilik** (lengkap dengan modal & profit) dan **Versi Dapur/Karyawan** (hanya takaran bahan tanpa angka uang).
11. **Sinkronisasi Akun Opsional (Auth):** Login Google/Email untuk menyimpan resep ke *cloud* (Supabase) agar bisa diakses lintas perangkat.

### B. Nice-to-Have (Pasca-MVP / V2)
* Manajemen katalog stok bahan baku terpusat (ubah harga 1 bahan, semua resep ikut ter-update).
* Kalkulator *bundling* multi-produk (kombinasi makanan + minuman).
* Riwayat perubahan harga bahan baku (grafik inflasi modal).
* Kolaborasi tim (akses khusus staf dapur).

## 5. Rumus Perhitungan Bisnis (Wajib Presisi)
Seluruh perhitungan keuangan **wajib** dilakukan oleh fungsi deterministik di sisi kode (bukan dihitung oleh AI/LLM).

1. **Biaya Bahan Efektif (dengan Penyusutan):**
   $$\text{Harga per Satuan Pakai} = \frac{\text{Harga Beli}}{\text{Qty Beli (dalam satuan pakai)} \times (1 - \text{Waste\%})}$$
   $$\text{Biaya Bahan} = \text{Qty Pakai} \times \text{Harga per Satuan Pakai}$$

2. **HPP per Porsi:**
   $$\text{HPP per Porsi} = \frac{\sum \text{Biaya Bahan} + \text{Total Overhead per Batch}}{\text{Jumlah Porsi}} + \text{Biaya Kemasan per Porsi}$$

3. **Harga Jual Berdasarkan Target Margin (Gross Margin):**
   $$\text{Harga Jual Offline} = \frac{\text{HPP per Porsi}}{1 - \text{Target Margin\%}}$$

4. **Harga Jual Multi-Channel (Contoh: Ojol dengan Komisi $k$ dan Biaya Tetap $f$):**
   $$\text{Harga Jual Channel} = \frac{\text{Harga Jual Offline} + f}{1 - k}$$

5. **Break-Even Point (BEP) Harian:**
   $$\text{BEP Bulanan (Porsi)} = \left\lceil \frac{\text{Total Biaya Tetap Bulanan}}{\text{Harga Jual} - \text{HPP per Porsi}} \right\rceil$$
   $$\text{BEP Harian (Porsi)} = \left\lceil \frac{\text{BEP Bulanan}}{\text{Hari Operasional per Bulan}} \right\rceil$$

## 6. User Flow Utama
1. **Masuk Aplikasi:** Pengguna membuka web $\rightarrow$ langsung melihat kanvas **Mode Cepat** (tanpa layar login penghalang).
2. **Input Data:** Pengguna memilih salah satu cara: (a) Foto struk belanja, (b) Ketik daftar bahan gaya chat, atau (c) Isi form manual / pilih template contoh (misal: *Es Kopi Susu* atau *Ayam Geprek*).
3. **Konfirmasi & Edit:** Sistem menampilkan tabel bahan yang sudah terkonversi satuannya. Pengguna mengisi biaya kemasan, *overhead* (opsional), dan jumlah porsi.
4. **Hasil Instan:** Kartu ringkasan di atas/bawah langsung menampilkan **HPP per Porsi**, **Rekomendasi Harga Jual**, **Profit Bersih**, dan **Indikator Kesehatan Margin**.
5. **Eksplorasi Mode Pro (Opsional):** Pengguna membuka tab di bawah hasil:
   * Tab *Channel* (cek harga GoFood/ShopeeFood).
   * Tab *Promo* (tes diskon agar tidak boncos).
   * Tab *BEP & What-If* (cek target porsi harian & simulasi kenaikan harga bahan).
6. **Ekspor & Simpan:** Pengguna menekan tombol **Bagikan ke WA / Download PDF** (pilih versi Pemilik atau Dapur), atau klik **Simpan ke Cloud** (memicu login ringan).