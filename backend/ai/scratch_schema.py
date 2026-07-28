import os
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('../../.env.local')
supabase = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY'))

tables = ['user_requests']

for table in tables:
    print(f"\n--- Table: {table} ---")
    res = supabase.table(table).select('*').limit(1).execute()
    if res.data:
        print(json.dumps(res.data[0], indent=2))
    else:
        print("Table is empty.")
