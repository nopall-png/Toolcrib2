"""
seed_transactions.py
Mengisi tabel user_requests & user_request_items di Supabase
dengan ~1000 baris riwayat transaksi dummy selama 1 tahun ke belakang.
Tujuan: menyediakan data historis agar AI Forecasting & Optimization bisa bekerja.

Jalankan sekali saja:
    python seed_transactions.py
"""

import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

# ── Konfigurasi ──
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env.local'))
load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL dan SUPABASE_KEY harus diset di .env.local")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Pola pemakaian berdasarkan kategori ──
# (frekuensi_per_bulan, qty_min, qty_max)
USAGE_PATTERNS = {
    'CUT': (20, 2, 10),   # Cutting tools: sangat sering, qty banyak
    'SAF': (25, 5, 20),   # Safety/PPE: paling sering, qty besar
    'HND': (12, 1, 3),    # Hand tools: cukup sering
    'ABR': (15, 3, 8),    # Abrasives: sering, konsumsi
    'FAS': (18, 5, 15),   # Fasteners: sering, qty banyak
    'CLN': (10, 2, 5),    # Cleaning: cukup sering
    'LUB': (8, 1, 3),     # Lubricants: agak jarang
    'MEA': (4, 1, 1),     # Measuring: jarang, selalu 1
    'ELC': (2, 1, 1),     # Electrical: sangat jarang
    'WLD': (6, 1, 2),     # Welding: jarang
}
DEFAULT_PATTERN = (8, 1, 3)


def main():
    print("=" * 60)
    print("SEED TRANSACTIONS — Mengisi riwayat peminjaman 1 tahun")
    print("=" * 60)

    # 1. Ambil data tools
    tools_res = supabase.table("tools").select("id, code, category").execute()
    tools = tools_res.data
    if not tools:
        print("[ERROR] Tabel 'tools' kosong. Jalankan seed_pdf.py dulu!")
        return

    print(f"[INFO] Ditemukan {len(tools)} tools di database.")

    # 2. Ambil data users & departments
    users_res = supabase.table("users").select("id, department_id").execute()
    users_data = users_res.data
    
    # Filter secara manual di Python agar aman dari error syntax API
    users = [u for u in users_data if u.get("department_id") is not None]
    
    if not users:
        print("[ERROR] Tabel 'users' kosong atau tidak ada user dengan department_id. Isi dulu!")
        return

    print(f"[INFO] Ditemukan {len(users)} users di database.")

    # 3. Cek apakah sudah ada data transaksi sebelumnya
    existing_res = supabase.table("user_requests").select("id", count="exact").execute()
    existing_count = existing_res.count if existing_res.count else 0
    if existing_count > 10:
        print(f"[WARNING] Sudah ada {existing_count} request di database.")
        confirm = input("Lanjutkan menambah data dummy? (y/n): ").strip().lower()
        if confirm != 'y':
            print("[INFO] Dibatalkan.")
            return

    # 4. Generate transaksi
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)

    all_requests = []
    all_items = []
    req_counter = existing_count + 1

    print(f"[INFO] Membuat transaksi dari {start_date.strftime('%Y-%m-%d')} s.d. {end_date.strftime('%Y-%m-%d')}...")

    for tool in tools:
        tool_id = tool['id']
        tool_code = tool['code']
        category = tool.get('category', '')

        freq_per_month, qty_min, qty_max = USAGE_PATTERNS.get(category, DEFAULT_PATTERN)

        # Hitung jumlah transaksi untuk tool ini selama 1 tahun
        total_transactions = max(1, int(freq_per_month * 12 * (0.5 + random.random())))

        # Batasi agar total transaksi global tidak meledak, tapi jangan terlalu kecil (maks 400 per SKU)
        total_transactions = min(total_transactions, 400)

        for _ in range(total_transactions):
            # Tanggal acak dalam rentang 1 tahun
            days_offset = random.randint(0, 365)
            req_date = start_date + timedelta(days=days_offset)

            # Pilih user acak
            user = random.choice(users)

            # Nomor request unik
            req_no = f"REQ-SEED-{req_counter:04d}"
            req_counter += 1

            qty = random.randint(qty_min, qty_max)

            all_requests.append({
                'request_no': req_no,
                'department_id': user['department_id'],
                'requestor_id': user['id'],
                'status': 'Approved',  # Transaksi selesai
                'request_date': req_date.isoformat(),
                'notes': f'Transaksi historis {tool_code}',
            })

            all_items.append({
                '_req_no': req_no,  # Referensi sementara, akan diganti dengan UUID
                'tool_id': tool_id,
                'quantity': qty,
            })

    print(f"[INFO] Total transaksi yang akan disuntikkan: {len(all_requests)}")

    # 5. Insert ke database dalam batch
    BATCH_SIZE = 50
    inserted_count = 0

    for i in range(0, len(all_requests), BATCH_SIZE):
        batch_requests = all_requests[i:i + BATCH_SIZE]
        batch_items_ref = all_items[i:i + BATCH_SIZE]

        # Insert requests
        res = supabase.table("user_requests").insert(batch_requests).select("id, request_no").execute()

        if not res.data:
            print(f"[ERROR] Gagal insert batch {i // BATCH_SIZE + 1}")
            continue

        # Mapping request_no → UUID
        req_no_to_id = {r['request_no']: r['id'] for r in res.data}

        # Siapkan items dengan UUID yang benar
        items_to_insert = []
        for item in batch_items_ref:
            req_id = req_no_to_id.get(item['_req_no'])
            if req_id:
                items_to_insert.append({
                    'request_id': req_id,
                    'tool_id': item['tool_id'],
                    'quantity': item['quantity'],
                })

        if items_to_insert:
            supabase.table("user_request_items").insert(items_to_insert).execute()

        inserted_count += len(batch_requests)
        print(f"  ✓ Batch {i // BATCH_SIZE + 1}: {len(batch_requests)} request inserted ({inserted_count}/{len(all_requests)})")

    print()
    print("=" * 60)
    print(f"✅ SELESAI! {inserted_count} transaksi dummy berhasil disuntikkan.")
    print(f"   Database Supabase Anda sekarang siap untuk AI Forecasting!")
    print("=" * 60)


if __name__ == "__main__":
    main()
