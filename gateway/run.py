"""Start the Plexa DB Gateway:  python run.py  (host/port via PLEXA_HOST / PLEXA_PORT)."""
import os

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "plexa_gateway.main:app",
        host=os.environ.get("PLEXA_HOST", "127.0.0.1"),
        port=int(os.environ.get("PLEXA_PORT", "8787")),
        proxy_headers=True,
        app_dir=os.path.dirname(os.path.abspath(__file__)),
    )
