# Database Schema & Data Contract: CuanTepat

Dokumen ini mendefinisikan kontrak data untuk **Supabase (PostgreSQL)** dan **LocalStorage** agar migrasi data dari *Guest Mode* ke akun terdaftar berjalan mulus tanpa perubahan struktur.

## 1. Diagram Relasi (ERD Ringkas)
* `auth.users` (1) $\longrightarrow$ (1) `profiles`
* `auth.users` (1) $\longrightarrow$ (N) `recipes`
* `recipes` (1) $\longrightarrow$ (N) `recipe_ingredients`
* `recipes` (1) $\longrightarrow$ (N) `recipe_channels`

## 2. Definisi Tabel (PostgreSQL / Supabase)

### A. `profiles`
Menyimpan preferensi bisnis default pengguna agar tidak perlu mengulang input setiap bikin resep baru.

| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, FK $\rightarrow$ `auth.users.id` ON DELETE CASCADE | ID pengguna |
| `business_name` | `text` | NULLABLE | Nama usaha/brand (muncul di PDF) |
| `default_fixed_cost` | `numeric(12,2)` | DEFAULT `0` | Biaya tetap bulanan default (untuk BEP) |
| `default_work_days` | `integer` | DEFAULT `26` | Hari operasional per bulan |
| `created_at` | `timestamptz` | DEFAULT `now()` | Waktu dibuat |
| `updated_at` | `timestamptz` | DEFAULT `now()` | Waktu diperbarui |

### B. `recipes`
Entitas utama produk/menu yang dihitung HPP-nya.

| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | ID resep |
| `user_id` | `uuid` | FK $\rightarrow$ `auth.users.id` ON DELETE CASCADE | Pemilik resep |
| `name` | `text` | NOT NULL | Nama produk (misal: "Es Kopi Susu Gula Aren") |
| `category` | `text` | DEFAULT `'makanan'` | Kategori (`makanan`, `minuman`, `kue`, `jasa`, `lainnya`) |
| `batch_portions` | `integer` | NOT NULL, CHECK (`batch_portions > 0`) | Jumlah porsi yang dihasilkan per 1 resep/batch |
| `packaging_cost_per_portion` | `numeric(12,2)` | DEFAULT `0` | Biaya kemasan per 1 porsi (cup, tutup, stiker) |
| `overhead_cost_per_batch` | `numeric(12,2)` | DEFAULT `0` | Biaya gas, listrik, air per batch |
| `labor_cost_per_batch` | `numeric(12,2)` | DEFAULT `0` | Alokasi gaji sendiri/karyawan per batch |
| `target_margin_percent` | `numeric(5,2)` | DEFAULT `35.00` | Target margin keuntungan (%) |
| `custom_selling_price` | `numeric(12,2)` | NULLABLE | Jika user menimpa saran harga jual secara manual |
| `notes` | `text` | NULLABLE | Catatan cara pembuatan (tampil di Versi Dapur) |
| `created_at` | `timestamptz` | DEFAULT `now()` | Waktu dibuat |
| `updated_at` | `timestamptz` | DEFAULT `now()` | Waktu diperbarui |

### C. `recipe_ingredients`
Daftar bahan baku dalam satu resep, lengkap dengan satuan beli, satuan pakai, dan faktor penyusutan.

| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | ID baris bahan |
| `recipe_id` | `uuid` | FK $\rightarrow$ `recipes.id` ON DELETE CASCADE | Relasi ke resep |
| `name` | `text` | NOT NULL | Nama bahan (misal: "Dada Ayam Fillet") |
| `buy_price` | `numeric(12,2)` | NOT NULL, CHECK (`buy_price >= 0`) | Harga beli sesuai struk |
| `buy_qty` | `numeric(10,3)` | NOT NULL, CHECK (`buy_qty > 0`) | Kuantitas beli (misal: `1`) |
| `buy_unit` | `text` | NOT NULL | Satuan beli (`kg`, `g`, `l`, `ml`, `pcs`, `lusin`, `karton`) |
| `pieces_per_carton` | `integer` | NULLABLE; wajib > 0 untuk konversi karton | Isi satu karton bahan ini sesuai kemasan; ikut disimpan saat reload/sinkronisasi. |
| `use_qty` | `numeric(10,3)` | NOT NULL, CHECK (`use_qty > 0`) | Kuantitas dipakai di resep (misal: `250`) |
| `use_unit` | `text` | NOT NULL | Satuan pakai (`g`, `ml`, `pcs`, `sdm`, `sdt`) |
| `waste_percent` | `numeric(5,2)` | DEFAULT `0`, CHECK (`waste_percent >= 0 AND waste_percent < 95`) | Persentase susut (0--94%) |
| `sort_order` | `integer` | DEFAULT `0` | Urutan tampilan bahan |

### D. `recipe_channels`
Konfigurasi kanal penjualan khusus untuk resep tersebut (GoFood, GrabFood, ShopeeFood, Marketplace).

| Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | ID konfigurasi kanal |
| `recipe_id` | `uuid` | FK $\rightarrow$ `recipes.id` ON DELETE CASCADE | Relasi ke resep |
| `channel_name` | `text` | NOT NULL | Contoh: `GoFood`, `GrabFood`, `ShopeeFood`, `Tokopedia` |
| `commission_percent` | `numeric(5,2)` | DEFAULT `20.00` | Potongan komisi platform (%) |
| `fixed_fee` | `numeric(12,2)` | DEFAULT `1000` | Biaya layanan/aplikasi tetap (Rp) |
| `is_active` | `boolean` | DEFAULT `true` | Aktif ditampilkan atau tidak |

## 3. Aturan Keamanan: Row Level Security (RLS)
Semua tabel **wajib** mengaktifkan RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

* **`profiles`:** Pengguna hanya bisa `SELECT`, `INSERT`, `UPDATE` baris di mana `auth.uid() = id`.
* **`recipes`:** Pengguna hanya bisa `SELECT`, `INSERT`, `UPDATE`, `DELETE` baris di mana `auth.uid() = user_id`.
* **`recipe_ingredients` & `recipe_channels`:** Pengguna hanya bisa mengakses baris jika `recipe_id` miliknya sendiri:
  ```sql
  EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = recipe_ingredients.recipe_id
    AND recipes.user_id = auth.uid()
  )
  ```

## 4. Kontrak Sinkronisasi LocalStorage (Guest Mode)
Key di `localStorage`: `cuantepat_guest_state_v1`.
Struktur JSON di `localStorage` **harus identik** dengan gabungan objek `recipes` + array `ingredients` + array `channels` di atas, ditambah properti `local_id: string` (UUID v4) dan `synced: boolean`. Saat pengguna login pertama kali, sistem menawarkan 1 klik tombol **"Simpan Resep Lokal ke Akun"** yang melakukan *batch insert* ke Supabase.

Satu draf aktif disimpan langsung sebagai objek resep (tanpa pembungkus store). Parameter percobaan Mode Pro disimpan terpisah di `cuantepat_guest_state_v1:simulasi` dan tidak dikirim ke tabel resep.