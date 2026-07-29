import os
import sys
from dotenv import load_dotenv
from supabase import create_client

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("No Supabase URL or Key found in .env.local")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    # Get all requests that DO NOT start with REQ-SEED (i.e., user's manual requests like REQ-0001, REQ-0002)
    response = supabase.table('user_requests').select('id, request_no').not_.like('request_no', 'REQ-SEED-%').execute()
    user_ids = [row['id'] for row in response.data]
    
    if user_ids:
        print(f"Found user requests to delete: {[row['request_no'] for row in response.data]}")
        # Delete items first 
        for req_id in user_ids:
            supabase.table('user_request_items').delete().eq('request_id', req_id).execute()
            
        # Delete the requests
        for req_id in user_ids:
            supabase.table('user_requests').delete().eq('id', req_id).execute()
            
        print(f"Successfully deleted {len(user_ids)} manual requests!")
    else:
        print("No manual user requests found to delete.")
except Exception as e:
    print(f"Error: {e}")
