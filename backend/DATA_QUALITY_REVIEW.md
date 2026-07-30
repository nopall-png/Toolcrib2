# 📈 Laporan Data Engineering & Quality Review (AI Layer)

Dokumen ini mencatat proses validasi data dan penyelesaian celah (*edge cases*) selama pengembangan layer AI untuk sistem Toolcrib. Dokumentasi ini berfungsi sebagai *changelog* dan studi kasus nyata terkait **Data Quality Assurance** sebelum *deploy* ke produksi.

## 1. Transisi ke Data Transaksi Riil (Backfill)
- **Konteks:** Sistem AI pada awalnya menggunakan data *dummy* statis di memori Python.
- **Tindakan:** Mengganti semua rujukan statis untuk membaca langsung dari tabel PostgreSQL Supabase (`stock_transactions` dan `machine_tools`).
- **Solusi Backfill:** Menggunakan SQL khusus untuk menarik (*extract*) data peminjaman yang berstatus selesai (seperti 'Sudah sampai') dari tabel transaksi sementara (`user_request_items`) dan merubahnya menjadi pergerakan *inventory* aktual di `stock_transactions` tanpa merusak riwayat transaksi yang ada (Idempotent menggunakan `ON CONFLICT DO NOTHING`).

## 2. Pembuatan Simulasi Data yang Realistis (Data Seeding)
- **Masalah:** Meng-generate data secara *random* murni akan merusak logika AI saat didemokan, karena AI tidak akan menemukan pola bisnis yang logis.
- **Tindakan:** Menerapkan **Category-Based Frequency & Volume**. 
- **Logika:** Skrip diatur sedemikian rupa agar barang tipe konsumabel (seperti *Cutting Tools* atau *Safety*) keluar puluhan kali sebulan dengan jumlah banyak, sedangkan barang investasi (seperti *Measuring* atau *Electrical*) keluar hanya 1-2 kali sebulan dengan jumlah sedikit.
- **Fix Cap Limit:** Menemukan dan menghapus *artificial cap* (batas 30 transaksi) pada skrip lama yang menyebabkan distribusi transaksi terpotong secara tidak wajar pada ~1000 baris, kini meningkat secara proporsional mendekati 10.000 transaksi historis (1 tahun penuh) hingga tanggal eksekusi terakhir.

## 3. Menangani Bias Model Time-Series (Zero-Fill Resampling)
- **Masalah (Bug):** Algoritma prediksi **Prophet** menghasilkan *Expected Demand* yang terlalu tinggi (rata di 1.0) untuk barang langka (*Slow-Moving*).
- **Akar Penyebab:** Data transaksi harian yang diberikan ke model hanya berisi hari-hari *di mana transaksi terjadi*. Hari kosong tidak diberikan, sehingga model mengasumsikan nilai *baseline* selalu 1 setiap kali ada aktivitas.
- **Solusi Terapan:** Mengimplementasikan **Zero-Fill Daily Resampling**.
  ```python
  all_dates = pd.date_range(start=min_date, end=max_date, freq='D')
  df_daily = df_daily.set_index('ds').reindex(all_dates, fill_value=0).reset_index()
  ```
  Ini secara eksplisit menyuntikkan nilai `0` untuk hari tanpa peminjaman. Alhasil, prediksi untuk barang *slow-moving* jatuh ke rata-rata yang benar (misal `0.02 - 0.08` per hari), secara otomatis mencegah penumpukan stok berlebih.

## 4. Akurasi Perhitungan ADU (Average Daily Usage)
- **Konteks:** ADU digunakan sebagai dasar perhitungan Safety Stock dan ROP dinamis.
- **Tindakan Pencegahan:** Menulis algoritma `get_daily_usage` agar **TIDAK** membagi total kuantitas dengan total baris transaksi. 
- **Logika:** Pembagian menggunakan `days_diff` (selisih hari di kalender asli antara transaksi pertama hingga terakhir). Ini memastikan ADU tetap akurat baik untuk barang yang sangat cepat habis maupun barang usang.

---
**Kesimpulan:** 
Proses-proses di atas menggaransi bahwa data analitik, *insight* persediaan, dan alarm kritis yang dikirim AI ke *frontend dashboard* merepresentasikan kalkulasi yang ketat secara bisnis dan tidak menghasilkan anomali palsu (*false positive*).

## 5. ROP Minimum Threshold (Catatan Desain)
- **Konteks:** Barang dengan transaksi yang sangat rendah (misal: total usage tahunan mendekati nol) secara matematis akan menghasilkan `ROP = 0` saat dikali dengan lead time.
- **Tindakan:** Menambahkan batasan keras (hard limit) `clip(lower=1)` untuk *Reorder Point* pada algoritma *Min-Max Engine*.
- **Implikasi Bisnis:** Keputusan *hard-code* minimum 1 ini sengaja dipilih karena *best practice* pergudangan: jika barang masih terdaftar di Master Data, maka ia diasumsikan memiliki fungsi operasional minimal, sehingga kita tidak ingin membiarkan stoknya menyentuh angka 0 mutlak tanpa memicu alarm *restock*. (Catatan: Untuk produksi, barang yang sudah dideklarasikan *discontinued* harus dieksklusi sejak awal pada query).

## 6. Curated Demo Data (Reproducibility & Idempotency)
- **Konteks:** Fitur *Dynamic Min-Max* membutuhkan variabilitas status (*UNDERSTOCK*, *OPTIMAL*, *OVERSTOCK*) agar tampilan alarm *Order Darurat* dapat didemonstrasikan dengan nyata pada presentasi. Namun *seeder* generator menghasilkan *current stock* acak tinggi (karena tidak terikat *ADU*).
- **Tindakan:** Bukannya sekadar meng-override tabel secara statis (yang bisa tertimpa ulang saat seeder dijalankan ulang), kami telah membakukan injeksi stok manual ini dalam *script* `backend/ai/adjust_stock.py`.
- **Hasil:** Kapanpun tabel ditimpa atau di-*re-seed* secara menyeluruh, Anda cukup menjalankan skrip `adjust_stock.py` kembali untuk memastikan SKU spesifik untuk *demo* (seperti `BRG-ELC-010` dan `BRG-ELC-009`) kembali berada di angka *understock* secara deterministik.

## 7. Edge Cases pada Optimasi Min-Max dan Inventory Analytics
Berdasarkan audit mendalam, terdapat 5 celah (*edge cases*) matematis pada mesin kalkulasi AI yang berhasil diselesaikan untuk memastikan ketahanan sistem di level produksi:
- **Perbaikan Kalkulasi ADU (Actual Days):** `minmax_optimizer.py` tidak lagi membagi total kuantitas dengan `365` secara *hardcode*, melainkan menghitung rentang hari *aktual* per SKU (`max(Date) - min(Date)`). Hal ini mencegah estimasi demand yang terlalu rendah (*underestimate*) bagi SKU baru yang histori transaksinya belum genap 1 tahun.
- **Handling SKU Tanpa Transaksi (NaN Prevention):** SKU baru tidak akan hilang dari radar sistem berkat penggunaan *left join*. Permasalahan krusial di mana `Actual_Days` menjadi `NaN` untuk barang tanpa histori telah diselesaikan dengan menyuntikkan `.fillna(1)` tepat sebelum operasi pembagian `Daily_Demand`. Ini mencegah sistem mengalami *crash* (Error 500) saat *rendering* JSON akibat tipe data yang cacat.
- **Klasifikasi XYZ untuk Histori Minim:** Algoritma kini menerapkan pembatasan (*guard*): Jika suatu SKU memiliki rentang histori kurang dari 3 bulan, SKU tersebut otomatis dilabeli kelas **"N/A"** daripada dipaksa masuk ke kategori "X" (Stabil), sehingga interpretasi varians *demand* menjadi lebih logis.
- **Aktivasi Safety Factor Berbasis Criticality:** Variabel `Criticality_Level` (`HIGH`, `MEDIUM`, `LOW`) telah berhasil disuntikkan ke dalam kerangka data dari Supabase. Perhitungan *Dynamic Min ROP* kini mendistribusikan *Safety Factor* secara dinamis (`2.0`, `1.5`, `1.2`) sesuai derajat kekritisan barang, bukan lagi ter-*fallback* diam-diam di `1.5`.
- **Konsistensi Status Antar Endpoint:** Algoritma penentu status (`OVERSTOCK`, `UNDERSTOCK`, `OPTIMAL`, `SLOW_MOVING`) telah diseragamkan dalam satu metode tunggal di `main.py`. Hal ini menjamin bahwa status alarm yang tampil di layar Min-Max 100% kongruen dengan layar *Inventory Optimization*.

by : arda & paris
