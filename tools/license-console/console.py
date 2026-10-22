"""Ikonet license console for Plexa DB — runs ONLY on Ikonet's PC.

    gateway\\.venv\\Scripts\\python tools\\license-console\\console.py

Opens http://127.0.0.1:8790 to issue, renew and look up customer licenses.
The private signing key and the registry live in  %USERPROFILE%\\.plexa-licensing\\
(never in the repository). Back that folder up: without the private key no new
license can be issued, and gateways only trust that key.
"""
import base64
import json
import secrets
import sqlite3
import sys
import threading
import webbrowser
from contextlib import contextmanager
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional

import uvicorn
from cryptography.hazmat.primitives import serialization
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

HOME = Path.home() / ".plexa-licensing"
PRIVATE_KEY = HOME / "ikonet_license_private.pem"
REGISTRY = HOME / "licenses.sqlite"
PORT = 8790


def _b64e(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _private_key():
    if not PRIVATE_KEY.exists():
        sys.exit(f"Private key not found: {PRIVATE_KEY}")
    return serialization.load_pem_private_key(PRIVATE_KEY.read_bytes(), None)


def sign(payload: dict) -> str:
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    return f"PLEXA1.{_b64e(body)}.{_b64e(_private_key().sign(body))}"


@contextmanager
def db():
    conn = sqlite3.connect(REGISTRY)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_registry():
    HOME.mkdir(exist_ok=True)
    with db() as c:
        c.execute("""CREATE TABLE IF NOT EXISTS licenses (
            lid TEXT PRIMARY KEY, customer TEXT NOT NULL, email TEXT, plan TEXT NOT NULL,
            max_users INTEGER, max_connections INTEGER, expires TEXT, gateway_id TEXT NOT NULL,
            license_key TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', notes TEXT DEFAULT '',
            replaces TEXT, issued_at TEXT NOT NULL)""")


class IssueIn(BaseModel):
    customer: str = Field(min_length=2, max_length=200)
    email: str = ""
    plan: str = "business"
    maxUsers: Optional[int] = Field(default=None, ge=1)
    maxConnections: Optional[int] = Field(default=None, ge=1)
    expires: Optional[date] = None
    gatewayId: str = "*"
    notes: str = ""


class RenewIn(BaseModel):
    expires: date


class NotesIn(BaseModel):
    notes: str = ""
    status: Optional[str] = None


app = FastAPI(title="Plexa DB — Ikonet license console")


def _issue(data: IssueIn, replaces: str = None) -> dict:
    lid = "LIC-" + secrets.token_hex(4).upper()
    payload = {
        "lid": lid, "customer": data.customer.strip(), "email": data.email.strip(), "plan": data.plan,
        "maxUsers": data.maxUsers, "maxConnections": data.maxConnections,
        "expires": data.expires.isoformat() if data.expires else None,
        "gatewayId": (data.gatewayId.strip() or "*").upper(),
        "issued": date.today().isoformat(),
    }
    key = sign(payload)
    with db() as c:
        c.execute("""INSERT INTO licenses (lid, customer, email, plan, max_users, max_connections, expires,
                     gateway_id, license_key, notes, replaces, issued_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                  (lid, payload["customer"], payload["email"], payload["plan"], payload["maxUsers"],
                   payload["maxConnections"], payload["expires"], payload["gatewayId"], key, data.notes,
                   replaces, datetime.now(timezone.utc).isoformat(timespec="seconds")))
        if replaces:
            c.execute("UPDATE licenses SET status = 'replaced' WHERE lid = ?", (replaces,))
    return get_license(lid)


@app.get("/")
def page():
    return FileResponse(Path(__file__).with_name("index.html"))


@app.get("/api/licenses")
def list_licenses():
    with db() as c:
        return [dict(r) for r in c.execute("SELECT * FROM licenses ORDER BY issued_at DESC")]


@app.get("/api/licenses/{lid}")
def get_license(lid: str):
    with db() as c:
        row = c.execute("SELECT * FROM licenses WHERE lid = ?", (lid,)).fetchone()
    if not row:
        raise HTTPException(404, "License not found")
    return dict(row)


@app.post("/api/licenses")
def issue(body: IssueIn):
    return _issue(body)


@app.post("/api/licenses/{lid}/renew")
def renew(lid: str, body: RenewIn):
    """Issues a new key with the same terms and a new expiry; the old one is marked 'replaced'."""
    old = get_license(lid)
    data = IssueIn(customer=old["customer"], email=old["email"] or "", plan=old["plan"], maxUsers=old["max_users"],
                   maxConnections=old["max_connections"], expires=body.expires, gatewayId=old["gateway_id"],
                   notes=old["notes"] or "")
    return _issue(data, replaces=lid)


@app.put("/api/licenses/{lid}")
def update_notes(lid: str, body: NotesIn):
    get_license(lid)
    with db() as c:
        c.execute("UPDATE licenses SET notes = ? WHERE lid = ?", (body.notes, lid))
        if body.status in ("active", "revoked"):
            c.execute("UPDATE licenses SET status = ? WHERE lid = ?", (body.status, lid))
    return get_license(lid)


if __name__ == "__main__":
    _private_key()  # fail early with a clear message
    init_registry()
    threading.Timer(1.5, lambda: webbrowser.open(f"http://127.0.0.1:{PORT}")).start()
    # 127.0.0.1 only: this console must never be reachable from the network.
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")
