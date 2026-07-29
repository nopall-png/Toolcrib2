import os
import psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
load_dotenv(env_path)
db_url = os.getenv('DATABASE_URL')

# Parse URL to use kwargs instead of string to avoid special character issues in psycopg2
result = urlparse(db_url)
username = result.username
password = result.password
database = result.path[1:]
hostname = result.hostname
port = result.port

print("Connecting to DB...")
try:
    conn = psycopg2.connect(
        database=database,
        user=username,
        password=password,
        host=hostname,
        port=port
    )
    cur = conn.cursor()

    print("\n--- 1. Check Tables ---")
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name IN ('user_requests', 'procurement_requests');
    """)
    for row in cur.fetchall():
        print(row)

    print("\n--- 2. Check stock_transactions foreign key ---")
    cur.execute("""
        SELECT COUNT(*) FROM stock_transactions st
        WHERE st.reference_request_id NOT IN (SELECT id FROM user_requests);
    """)
    for row in cur.fetchall():
        print(row)

    print("\n--- 3. Check ENUM type of status column ---")
    cur.execute("""
        SELECT column_name, udt_name FROM information_schema.columns 
        WHERE table_name IN ('user_requests', 'procurement_requests') AND column_name = 'status';
    """)
    for row in cur.fetchall():
        print(row)

    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
