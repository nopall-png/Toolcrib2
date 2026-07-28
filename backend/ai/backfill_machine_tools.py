import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv('../../.env.local')
load_dotenv('../../.env')
load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
# PERBAIKAN: Gunakan SERVICE_ROLE_KEY agar bisa bypass RLS saat Insert
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diset di .env.local.")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_all(table_name, select_query="*"):
    all_data = []
    limit = 1000
    offset = 0
    while True:
        res = supabase.table(table_name).select(select_query).range(offset, offset + limit - 1).execute()
        data = res.data
        if not data:
            break
        all_data.extend(data)
        if len(data) < limit:
            break
        offset += limit
    return all_data

def run_backfill():
    print("🚀 Memulai proses backfill machine_tools...")

    # 1. Ambil semua mesin
    try:
        machines = fetch_all('machines', 'id, downtime_impact, required_parts')
    except Exception as e:
        print(f"❌ Gagal mengambil data machines: {e}")
        sys.exit(1)

    print(f"✅ Ditemukan {len(machines)} mesin.")

    # 2. Ambil semua tools (mapping code -> id)
    try:
        tools_data = fetch_all('tools', 'id, code')
        tools = {t['code'].strip(): t['id'] for t in tools_data if t.get('code')}
    except Exception as e:
        print(f"❌ Gagal mengambil data tools: {e}")
        sys.exit(1)

    print(f"✅ Ditemukan {len(tools)} tools di master data.")

    # 3. Ambil relasi yang sudah ada di machine_tools (Idempotency)
    try:
        existing_data = fetch_all('machine_tools', 'machine_id, tool_id')
        existing_pairs = {(e['machine_id'], e['tool_id']) for e in existing_data}
    except Exception as e:
        print(f"⚠️ Tabel machine_tools mungkin belum dibuat, atau error: {e}")
        existing_pairs = set()

    # 4. Parsing dan Insert
    impact_map = {'HIGH': 100, 'MEDIUM': 50, 'LOW': 20}
    insert_payloads = []
    skipped_count = 0
    not_found_count = 0

    for machine in machines:
        machine_id = machine['id']
        impact = str(machine.get('downtime_impact', 'MEDIUM')).strip().upper()
        weight = impact_map.get(impact, 50)
        
        raw_parts = machine.get('required_parts')
        if not raw_parts:
            continue
            
        # Parse comma-separated tool codes
        parts = [p.strip() for p in raw_parts.split(',')]
        for code in parts:
            if not code or code.upper() == 'NONE':
                continue
                
            tool_id = tools.get(code)
            if not tool_id:
                print(f"   ⚠️ WARNING: Tool dengan kode '{code}' tidak ditemukan di tabel tools. Dilewati.")
                not_found_count += 1
                continue
                
            if (machine_id, tool_id) in existing_pairs:
                skipped_count += 1
                continue
                
            insert_payloads.append({
                'machine_id': machine_id,
                'tool_id': tool_id,
                'impact_weight': weight
            })
            # Tandai sudah diproses agar tidak duplikat dalam satu batch
            existing_pairs.add((machine_id, tool_id))

    print(f"\n📊 SUMMARY PRE-INSERT:")
    print(f" - {len(insert_payloads)} relasi baru siap di-insert.")
    print(f" - {skipped_count} relasi sudah ada (dilewati).")
    print(f" - {not_found_count} kode tool tidak ditemukan.")

    if insert_payloads:
        try:
            # Insert dalam batch
            # Kita pecah per 100 jika terlalu besar
            batch_size = 100
            for i in range(0, len(insert_payloads), batch_size):
                batch = insert_payloads[i:i+batch_size]
                supabase.table('machine_tools').insert(batch).execute()
            print("✅ Berhasil menyimpan relasi machine_tools ke Supabase!")
        except Exception as e:
            print(f"❌ Gagal menyimpan relasi: {e}")
    else:
        print("✅ Tidak ada relasi baru yang perlu di-insert.")

if __name__ == "__main__":
    run_backfill()
