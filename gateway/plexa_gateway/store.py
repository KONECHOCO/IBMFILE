"""Gateway's own metadata store (SQLite): users, saved connections, audit trail."""
import hashlib
import json
import sqlite3
import threading
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone

from . import config

_lock = threading.Lock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin', 'analyst', 'viewer')),
    created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS connections (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    driver        TEXT NOT NULL,
    host          TEXT NOT NULL DEFAULT '',
    port          INTEGER,
    database      TEXT NOT NULL DEFAULT '',
    username      TEXT NOT NULL DEFAULT '',
    password_enc  TEXT NOT NULL DEFAULT '',
    ssl           INTEGER NOT NULL DEFAULT 0,
    options       TEXT NOT NULL DEFAULT '{}',
    is_demo       INTEGER NOT NULL DEFAULT 0,
    created_by    TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit (
    seq             INTEGER PRIMARY KEY AUTOINCREMENT,
    ts              TEXT NOT NULL,
    username        TEXT NOT NULL,
    role            TEXT NOT NULL,
    connection_id   TEXT,
    connection_name TEXT,
    action          TEXT NOT NULL,
    statement       TEXT,
    rows            INTEGER NOT NULL DEFAULT 0,
    duration_ms     INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL,
    client_ip       TEXT,
    prev_hash       TEXT NOT NULL,
    hash            TEXT NOT NULL
);
"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@contextmanager
def connect():
    conn = sqlite3.connect(config.DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init() -> None:
    with connect() as db:
        db.executescript(SCHEMA)


# ── Users ───────────────────────────────────────────────────────────────────


def count_users() -> int:
    with connect() as db:
        return db.execute("SELECT COUNT(*) FROM users").fetchone()[0]


def create_user(username: str, password_hash: str, role: str) -> dict:
    user = {"id": str(uuid.uuid4()), "username": username, "role": role, "created_at": now()}
    with connect() as db:
        db.execute(
            "INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
            (user["id"], username, password_hash, role, user["created_at"]),
        )
    return user


def get_user_by_name(username: str):
    with connect() as db:
        row = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    return dict(row) if row else None


def get_user(user_id: str):
    with connect() as db:
        row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return dict(row) if row else None


def list_users() -> list:
    with connect() as db:
        rows = db.execute("SELECT id, username, role, created_at FROM users ORDER BY username").fetchall()
    return [dict(r) for r in rows]


def delete_user(user_id: str) -> None:
    with connect() as db:
        db.execute("DELETE FROM users WHERE id = ?", (user_id,))


# ── Connections ─────────────────────────────────────────────────────────────

_CONN_FIELDS = ("name", "driver", "host", "port", "database", "username", "password_enc", "ssl", "options", "is_demo")


def _conn_row(row) -> dict:
    d = dict(row)
    d["options"] = json.loads(d.get("options") or "{}")
    d["ssl"] = bool(d["ssl"])
    d["is_demo"] = bool(d["is_demo"])
    return d


def list_connections() -> list:
    with connect() as db:
        rows = db.execute("SELECT * FROM connections ORDER BY is_demo, name").fetchall()
    return [_conn_row(r) for r in rows]


def get_connection(conn_id: str):
    with connect() as db:
        row = db.execute("SELECT * FROM connections WHERE id = ?", (conn_id,)).fetchone()
    return _conn_row(row) if row else None


def save_connection(data: dict, conn_id: str = None, created_by: str = None) -> dict:
    values = {k: data[k] for k in _CONN_FIELDS if k in data}
    if "options" in values:
        values["options"] = json.dumps(values["options"] or {})
    if "ssl" in values:
        values["ssl"] = int(bool(values["ssl"]))
    if "is_demo" in values:
        values["is_demo"] = int(bool(values["is_demo"]))
    ts = now()
    with connect() as db:
        if conn_id:
            values["updated_at"] = ts
            sets = ", ".join(f"{k} = ?" for k in values)
            db.execute(f"UPDATE connections SET {sets} WHERE id = ?", (*values.values(), conn_id))
        else:
            conn_id = str(uuid.uuid4())
            values.update(id=conn_id, created_by=created_by, created_at=ts, updated_at=ts)
            cols = ", ".join(values)
            marks = ", ".join("?" for _ in values)
            db.execute(f"INSERT INTO connections ({cols}) VALUES ({marks})", tuple(values.values()))
    return get_connection(conn_id)


def delete_connection(conn_id: str) -> None:
    with connect() as db:
        db.execute("DELETE FROM connections WHERE id = ?", (conn_id,))


# ── Audit trail (hash chain: each entry seals the previous one) ─────────────

_GENESIS = "0" * 64
_AUDIT_HASHED = ("ts", "username", "role", "connection_id", "connection_name", "action",
                 "statement", "rows", "duration_ms", "status", "client_ip")


def _entry_hash(prev_hash: str, entry: dict) -> str:
    payload = json.dumps({k: entry.get(k) for k in _AUDIT_HASHED}, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256((prev_hash + payload).encode()).hexdigest()


def audit(**entry) -> dict:
    entry = {k: entry.get(k) for k in _AUDIT_HASHED}
    entry["ts"] = entry["ts"] or now()
    entry["rows"] = int(entry["rows"] or 0)
    entry["duration_ms"] = int(entry["duration_ms"] or 0)
    if entry["statement"] and len(entry["statement"]) > 4000:
        entry["statement"] = entry["statement"][:4000] + "…"
    with _lock, connect() as db:
        last = db.execute("SELECT hash FROM audit ORDER BY seq DESC LIMIT 1").fetchone()
        prev = last[0] if last else _GENESIS
        entry["prev_hash"] = prev
        entry["hash"] = _entry_hash(prev, entry)
        cols = ", ".join(entry)
        marks = ", ".join("?" for _ in entry)
        cur = db.execute(f"INSERT INTO audit ({cols}) VALUES ({marks})", tuple(entry.values()))
        entry["seq"] = cur.lastrowid
    return entry


def list_audit(limit: int = 500) -> list:
    with connect() as db:
        rows = db.execute("SELECT * FROM audit ORDER BY seq DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]


def verify_audit() -> dict:
    """Recompute the whole chain; any edited, deleted or reordered row breaks it."""
    prev = _GENESIS
    count = 0
    with connect() as db:
        for row in db.execute("SELECT * FROM audit ORDER BY seq"):
            entry = dict(row)
            if entry["prev_hash"] != prev or _entry_hash(prev, entry) != entry["hash"]:
                return {"valid": False, "checked": count, "broken_at": entry["seq"]}
            prev = entry["hash"]
            count += 1
    return {"valid": True, "checked": count, "broken_at": None}
