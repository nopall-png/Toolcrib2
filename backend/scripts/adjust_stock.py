import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Add parent dir to path so environment variables load correctly
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env.local'))

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

# Dictionary of item codes and their new intended mock stock
# to demonstrate UNDERSTOCK, OPTIMAL, and OVERSTOCK in the demo.
items_to_adjust = {
    'BRG-ELC-010': 3,  # ROP was 5, current 3 -> UNDERSTOCK
    'BRG-ELC-009': 2,  # ROP was 3, current 2 -> UNDERSTOCK
    'BRG-MEA-002': 6,  # ROP was 8, current 6 -> UNDERSTOCK
    'BRG-ELC-008': 5,  # ROP was 4, Max 6, current 5 -> OPTIMAL
    'BRG-HND-005': 15, # ROP was 12, Max 30, current 15 -> OPTIMAL
    'BRG-ELC-040': 2,  # Min will be 1 (clipped), current 2 -> OPTIMAL
    'BRG-ELC-056': 1,  # Min will be 1 (clipped), current 1 -> OPTIMAL (or borderline)
}

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("Adjusting stock in Supabase 'tools' table for demo purposes...")
for code, stock in items_to_adjust.items():
    try:
        supabase.table('tools').update({'stock': stock}).eq('code', code).execute()
        print(f"[OK] Updated {code} to {stock}")
    except Exception as e:
        print(f"[ERROR] Failed to update {code}: {e}")

print("Stock adjustment complete!")
