"""Start the Plexa DB Gateway:  python run.py  (host/port via PLEXA_HOST / PLEXA_PORT)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import uvicorn

from plexa_gateway import config

if __name__ == "__main__":
    # Imported here (not by name) so it also works inside the PyInstaller executable
    from plexa_gateway.main import app

    uvicorn.run(app, host=config.HOST, port=config.PORT, log_config=None if getattr(sys, "frozen", False) else uvicorn.config.LOGGING_CONFIG)
