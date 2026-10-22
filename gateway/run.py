"""Start the Plexa DB Gateway:  python run.py  (host/port via PLEXA_HOST / PLEXA_PORT)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import uvicorn

from plexa_gateway import config

if __name__ == "__main__":
    uvicorn.run(
        "plexa_gateway.main:app",
        host=config.HOST,
        port=config.PORT,
        app_dir=os.path.dirname(os.path.abspath(__file__)),
    )
