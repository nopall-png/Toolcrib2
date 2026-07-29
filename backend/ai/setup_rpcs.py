import os
import sys
import psycopg2
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
load_dotenv(env_path)
db_url = os.getenv('DATABASE_URL')
if db_url:
    db_url = db_url.strip('"').strip("'")

if not db_url:
    print("No DATABASE_URL found in .env.local")
    sys.exit(1)

import urllib.parse

print(f"Connecting to: {db_url}")

try:
    parsed = urllib.parse.urlparse(db_url)
    password = parsed.password
    password = urllib.parse.unquote(password)
    
    # Extract project reference from the username (e.g. postgres.projectid -> projectid)
    project_id = parsed.username.split('.')[-1]
    direct_host = f"db.{project_id}.supabase.co"
    
    conn = psycopg2.connect(
        dbname=parsed.path[1:],
        user="postgres",
        password=password,
        host=direct_host,
        port=5432
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. RPC: get_next_request_no
    print("Creating RPC get_next_request_no...")
    cursor.execute("""
    CREATE SEQUENCE IF NOT EXISTS user_request_no_seq START 1;
    
    CREATE OR REPLACE FUNCTION get_next_request_no()
    RETURNS text AS $$
    DECLARE
        next_id integer;
        padded_id text;
    BEGIN
        SELECT nextval('user_request_no_seq') INTO next_id;
        padded_id := lpad(next_id::text, 4, '0');
        RETURN 'REQ-' || padded_id;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # 2. RPC: approve_toolcrib_request (ACID transaction for approving requests)
    print("Creating RPC approve_toolcrib_request...")
    cursor.execute("""
    CREATE OR REPLACE FUNCTION approve_toolcrib_request(req_id uuid)
    RETURNS void AS $$
    DECLARE
        item RECORD;
        current_stock integer;
    BEGIN
        -- Update status request
        UPDATE public.user_requests 
        SET status = 'Approved' 
        WHERE id = req_id;

        -- Loop through items
        FOR item IN 
            SELECT tool_id, quantity 
            FROM public.user_request_items 
            WHERE request_id = req_id 
        LOOP
            -- Check stock
            SELECT stock INTO current_stock FROM public.tools WHERE id = item.tool_id FOR UPDATE;
            
            IF current_stock < item.quantity THEN
                RAISE EXCEPTION 'Stok tidak mencukupi untuk tool_id %', item.tool_id;
            END IF;

            -- Deduct stock
            UPDATE public.tools 
            SET stock = stock - item.quantity 
            WHERE id = item.tool_id;

            -- Record stock transaction
            INSERT INTO public.stock_transactions (tool_id, transaction_type, quantity, reference_request_id)
            VALUES (item.tool_id, 'OUT', item.quantity, req_id);
            
        END LOOP;
    END;
    $$ LANGUAGE plpgsql;
    """)
    
    print("All RPCs created successfully!")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
