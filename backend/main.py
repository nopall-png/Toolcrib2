"""
PTMI ToolCrib - Predictive AI Engine Launcher (Root Compatibility)
File: backend/ai/main.py
Description: Forwards execution to backend/ai/predictive/predictive_ai.py
Port: 8000
"""

import os
import sys

PREDICTIVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'predictive')
if PREDICTIVE_DIR not in sys.path:
    sys.path.insert(0, PREDICTIVE_DIR)

from predictive.predictive_ai import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
