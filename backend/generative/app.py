"""
PTMI ToolCrib - Generative AI Engine Launcher
File: app.py
Port: 8001
"""

from generative_ai import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("generative_ai:app", host="0.0.0.0", port=8001, reload=False)
