"""
PTMI ToolCrib - Generative AI Engine Launcher (Root Compatibility)
File: toolcrib/ai/app.py
Description: Forwards execution to backend/ai/generative/generative_ai.py
Port: 8001
"""

import os
import sys

GENERATIVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend', 'generative')
if GENERATIVE_DIR not in sys.path:
    sys.path.insert(0, GENERATIVE_DIR)

from generative_ai import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
