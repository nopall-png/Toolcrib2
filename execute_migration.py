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
    
    with open('backend/ai/migration_requests.sql', 'r') as f:
        sql = f.read()
        
    print("Executing migration_requests.sql...")
    cursor.execute(sql)
    
    print("SQL execution successful. Tables created.")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
