# Contoh Simulasi Riwayat Transaksi (Dummy)

Berikut adalah gambaran bagaimana data simulasi transaksi pengeluaran barang akan dibuat, berdasarkan kode SKU asli yang kita ambil dari PDF `PT_Mattel_ToolCrib_Dataset.pdf`.

Data ini akan diacak sepanjang 1 tahun terakhir dengan pola tertentu agar AI *Forecasting* bisa mendeteksi tren.

| Tanggal Keluar | Kode SKU (Real) | Nama Alat (Real) | Jumlah Keluar | Peminjam | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2023-07-01 | BRG-CUT-005 | Carbide End Mill 10mm | 5 | Divisi 1 | Approved |
| 2023-07-02 | BRG-MET-081 | Vernier Caliper 0-150mm | 1 | Divisi 2 | Approved |
| 2023-07-05 | BRG-HND-054 | Wrench Set Metric | 2 | Divisi 1 | Approved |
| 2023-07-08 | BRG-CUT-012 | HSS Drill Bit 5mm | 10 | Divisi 3 | Approved |
| 2023-07-10 | BRG-CUT-005 | Carbide End Mill 10mm | 4 | Divisi 1 | Approved |
| 2023-07-15 | BRG-MET-111 | Outside Micrometer 25-50mm | 1 | Divisi 2 | Approved |
| ... | ... | ... | ... | ... | ... |
| 2024-07-26 | BRG-HND-077 | Dead Blow Hammer | 1 | Divisi 3 | Approved |
| 2024-07-27 | BRG-CUT-005 | Carbide End Mill 10mm | 6 | Divisi 1 | Approved |

*Catatan: Pola pemakaian dibedakan. Barang seperti mata bor (Drill Bit/End Mill) akan diset sering keluar dalam jumlah banyak, sedangkan alat ukur (Caliper/Micrometer) jarang keluar dan hanya 1 unit.*
