import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env.local')
db_url = os.getenv('DATABASE_URL')

if not db_url:
    print("No DATABASE_URL found")
    sys.exit(1)

try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. Create machine_tools table
    print("Creating machine_tools table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS public.machine_tools (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
      tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
      impact_weight integer DEFAULT 50 CHECK (impact_weight BETWEEN 1 AND 100),
      created_at timestamp with time zone DEFAULT now(),
      CONSTRAINT machine_tools_pkey PRIMARY KEY (id),
      CONSTRAINT machine_tools_unique_mapping UNIQUE (machine_id, tool_id)
    );
    """)
    
    # 2. Add Caching columns
    print("Adding caching columns to tools table...")
    cursor.execute("""
    ALTER TABLE public.tools 
    ADD COLUMN IF NOT EXISTS ai_min_stock integer,         
    ADD COLUMN IF NOT EXISTS ai_max_stock integer,         
    ADD COLUMN IF NOT EXISTS abc_class character varying(1), 
    ADD COLUMN IF NOT EXISTS xyz_class character varying(1);
    """)
    
    print("SQL execution successful.")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
