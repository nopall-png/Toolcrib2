import sys
import traceback
import json
sys.path.append('backend/ai')
import main

try:
    res = main.sync_ai_cache()
    with open('sync_result.txt', 'w') as f:
        json.dump(res, f)
except Exception as e:
    with open('sync_result.txt', 'w') as f:
        f.write("Error: " + str(e) + "\n" + traceback.format_exc())
