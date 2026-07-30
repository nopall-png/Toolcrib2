import sys
import traceback
sys.path.append('backend/ai')
import main

try:
    res = main.sync_ai_cache()
    print("Result:", res)
except Exception as e:
    print("Error:", e)
    traceback.print_exc()
