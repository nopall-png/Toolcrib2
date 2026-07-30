"""
PTMI ToolCrib - Predictive AI Engine Launcher
File: main.py
Port: 8000
"""

from predictive_ai import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("predictive_ai:app", host="0.0.0.0", port=8000, reload=True)
