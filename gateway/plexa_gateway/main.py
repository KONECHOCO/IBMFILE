"""Plexa DB Gateway HTTP API.

Run with:  python -m plexa_gateway   (see run.py / README)
"""
import secrets
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import __version__, config, demo, drivers, licensing, runner, sqlguard, store
from .security import encrypt, hash_password, make_token, read_token, verify_password

ROLES = ("admin", "analyst", "viewer")

# One-time code printed in the gateway console: whoever can read the server's
# logs owns the gateway, not whoever reaches the URL first.
SETUP_CODE = {"value": None}

# Failed setup/login attempts per client IP: (count, first_failure_time).
_FAILURES: dict = {}
_MAX_FAILURES, _WINDOW_S = 10, 300


def _throttle(ip: str):
    count, since = _FAILURES.get(ip, (0, 0.0))
    if count >= _MAX_FAILURES and time.time() - since < _WINDOW_S:
        raise HTTPException(429, "Too many failed attempts. Try again in a few minutes.")


# Queries per client IP in the last minute (only when PLEXA_QUERIES_PER_MINUTE > 0).
_QUERY_TIMES: dict = {}


def _rate_limit_queries(ip: str):
    if config.QUERIES_PER_MINUTE <= 0:
        return
    now = time.time()
    recent = [t for t in _QUERY_TIMES.get(ip, []) if now - t < 60]
    if len(recent) >= config.QUERIES_PER_MINUTE:
        raise HTTPException(429, "Too many queries. Wait a minute and try again.")
    recent.append(now)
    _QUERY_TIMES[ip] = recent


def _fail(ip: str):
    count, since = _FAILURES.get(ip, (0, 0.0))
    if time.time() - since >= _WINDOW_S:
        count, since = 0, time.time()
    _FAILURES[ip] = (count + 1, since)


@asynccontextmanager
async def lifespan(_app):
    store.init()
    if config.BOOTSTRAP_ADMIN_USER and config.BOOTSTRAP_ADMIN_PASSWORD and store.count_users() == 0:
        store.create_user(config.BOOTSTRAP_ADMIN_USER, hash_password(config.BOOTSTRAP_ADMIN_PASSWORD), "admin")
    if config.PUBLIC_DEMO:
        demo.ensure_demo_user(store, hash_password(config.DEMO_PASSWORD))
    if store.count_users() == 0:
        SETUP_CODE["value"] = f"{secrets.randbelow(10**6):06d}"
        print(f"\n  Plexa DB Gateway - first start.\n  Setup code: {SETUP_CODE['value']}\n", flush=True)
    if config.DEMO_MODE:
        demo.ensure(store)
    yield


app = FastAPI(title="Plexa DB Gateway", version=__version__, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=config.CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"],
)


# ── Auth ────────────────────────────────────────────────────────────────────


def current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Sign-in required.")
    try:
        claims = read_token(authorization[7:])
    except Exception:
        raise HTTPException(401, "Session expired or invalid. Please sign in again.")
    user = store.get_user(claims["sub"])
    if not user:
        raise HTTPException(401, "User no longer exists.")
    return user


def admin_user(user: dict = Depends(current_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(403, "Administrators only.")
    return user


def _public_user(u: dict) -> dict:
    return {"id": u["id"], "username": u["username"], "role": u["role"]}


class Credentials(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=256)


class NewUser(Credentials):
    role: str = "analyst"


class SetupIn(Credentials):
    setupCode: str


@app.get("/api/health")
def health():
    info = {"status": "ok", "product": "Plexa DB Gateway", "version": __version__,
            "setupRequired": store.count_users() == 0, "maxRows": config.MAX_ROWS, "publicDemo": config.PUBLIC_DEMO}
    if config.PUBLIC_DEMO:
        info["demoCredentials"] = {"username": config.DEMO_USER, "password": config.DEMO_PASSWORD}
    return info


@app.post("/api/auth/setup")
def setup(body: SetupIn, request: Request):
    """Creates the first administrator. Only works while the gateway has no users."""
    if store.count_users() > 0:
        raise HTTPException(409, "The gateway is already set up.")
    _throttle(_ip(request))
    if not SETUP_CODE["value"] or not secrets.compare_digest(body.setupCode.strip(), SETUP_CODE["value"]):
        _fail(_ip(request))
        raise HTTPException(403, "Wrong setup code: you can find it in the gateway console.")
    user = store.create_user(body.username, hash_password(body.password), "admin")
    SETUP_CODE["value"] = None
    _audit(request, user, "setup", status="OK")
    return {"token": make_token(user), "user": _public_user(user)}


@app.post("/api/auth/login")
def login(body: Credentials, request: Request):
    _throttle(_ip(request))
    user = store.get_user_by_name(body.username)
    if not user or not verify_password(body.password, user["password_hash"]):
        _fail(_ip(request))
        store.audit(username=body.username, role="-", action="login.denied", status="DENIED",
                    client_ip=_ip(request))
        raise HTTPException(401, "Wrong username or password.")
    _audit(request, user, "login", status="OK")
    return {"token": make_token(user), "user": _public_user(user)}


@app.get("/api/auth/me")
def me(user: dict = Depends(current_user)):
    return _public_user(user)


@app.get("/api/users")
def users(_: dict = Depends(admin_user)):
    return store.list_users()


@app.post("/api/users")
def add_user(body: NewUser, request: Request, admin: dict = Depends(admin_user)):
    if body.role not in ROLES:
        raise HTTPException(400, f"Invalid role. Allowed: {', '.join(ROLES)}")
    if store.get_user_by_name(body.username):
        raise HTTPException(409, "Username already taken.")
    _within_license("users", store.count_users())
    user = store.create_user(body.username, hash_password(body.password), body.role)
    _audit(request, admin, "user.create", statement=f"{body.username} ({body.role})", status="OK")
    return _public_user(user)


@app.delete("/api/users/{user_id}")
def remove_user(user_id: str, request: Request, admin: dict = Depends(admin_user)):
    if user_id == admin["id"]:
        raise HTTPException(400, "You cannot delete your own user.")
    target = store.get_user(user_id)
    if not target:
        raise HTTPException(404, "User not found.")
    store.delete_user(user_id)
    _audit(request, admin, "user.delete", statement=target["username"], status="OK")
    return {"ok": True}


class UserUpdate(BaseModel):
    role: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=256)


@app.put("/api/users/{user_id}")
def update_user(user_id: str, body: UserUpdate, request: Request, admin: dict = Depends(admin_user)):
    """Change role and/or reset the password (support: user locked out)."""
    target = store.get_user(user_id)
    if not target:
        raise HTTPException(404, "User not found.")
    if body.role is not None:
        if body.role not in ROLES:
            raise HTTPException(400, f"Invalid role. Allowed: {', '.join(ROLES)}")
        if target["role"] == "admin" and body.role != "admin" and store.count_admins() <= 1:
            raise HTTPException(400, "At least one administrator must remain.")
        store.set_role(user_id, body.role)
        _audit(request, admin, "user.role", statement=f"{target['username']} -> {body.role}", status="OK")
    if body.password:
        store.set_password(user_id, hash_password(body.password))
        _audit(request, admin, "user.password", statement=target["username"], status="OK")
    return _public_user(store.get_user(user_id))


def _within_license(kind: str, current: int):
    try:
        licensing.ensure_can_add(kind, current)
    except licensing.LicenseError as e:
        raise HTTPException(402, str(e))


# ── Drivers & connections ───────────────────────────────────────────────────


@app.get("/api/drivers")
def list_drivers(_: dict = Depends(current_user)):
    return [d.describe() for d in drivers.DRIVERS.values()]


class ConnectionIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    driver: str
    host: str = ""
    port: Optional[int] = None
    database: str = ""
    username: str = ""
    password: Optional[str] = None  # None on update = keep the stored one
    ssl: bool = False
    options: dict = {}


def _public_conn(c: dict) -> dict:
    d = drivers.DRIVERS.get(c["driver"])
    return {
        "id": c["id"], "name": c["name"], "driver": c["driver"], "driverLabel": d.label if d else c["driver"],
        "host": c["host"], "port": c["port"], "database": c["database"], "username": c["username"],
        "hasPassword": bool(c["password_enc"]), "ssl": c["ssl"], "options": c["options"],
        "isDemo": c["is_demo"], "defaultSchema": d.default_schema(c) if d else None,
        "readOnlyNote": d.read_only_note if d else "", "updatedAt": c["updated_at"],
    }


def _conn_or_404(conn_id: str) -> dict:
    c = store.get_connection(conn_id)
    if not c:
        raise HTTPException(404, "Connection not found.")
    return c


def _validated(body: ConnectionIn) -> dict:
    driver = drivers.DRIVERS.get(body.driver)
    if not driver:
        raise HTTPException(400, f"Unsupported database type: {body.driver}")
    if driver.uses_host and not body.host.strip():
        raise HTTPException(400, "Host is required.")
    data = body.model_dump()
    data["host"] = data["host"].strip()
    data["port"] = data["port"] or driver.default_port
    password = data.pop("password")
    if password is not None:
        data["password_enc"] = encrypt(password)
    return data


@app.get("/api/connections")
def list_connections(_: dict = Depends(current_user)):
    return [_public_conn(c) for c in store.list_connections()]


@app.post("/api/connections")
def create_connection(body: ConnectionIn, request: Request, admin: dict = Depends(admin_user)):
    _within_license("connections", store.count_connections())
    c = store.save_connection(_validated(body), created_by=admin["id"])
    _audit(request, admin, "conn.create", conn=c, status="OK")
    return _public_conn(c)


@app.put("/api/connections/{conn_id}")
def update_connection(conn_id: str, body: ConnectionIn, request: Request, admin: dict = Depends(admin_user)):
    existing = _conn_or_404(conn_id)
    if existing["is_demo"]:
        raise HTTPException(400, "The demo connection cannot be edited.")
    c = store.save_connection(_validated(body), conn_id=conn_id)
    _audit(request, admin, "conn.update", conn=c, status="OK")
    return _public_conn(c)


@app.delete("/api/connections/{conn_id}")
def delete_connection(conn_id: str, request: Request, admin: dict = Depends(admin_user)):
    c = _conn_or_404(conn_id)
    store.delete_connection(conn_id)
    _audit(request, admin, "conn.delete", conn=c, status="OK")
    return {"ok": True}


def _db_error(e: Exception) -> HTTPException:
    if isinstance(e, drivers.DriverUnavailable):
        return HTTPException(501, str(e))
    msg = str(e).strip() or e.__class__.__name__
    return HTTPException(502, f"Database error: {msg[:2000]}")


def _test(c: dict, request: Request, user: dict):
    try:
        result = runner.test_connection(c)
    except Exception as e:
        _audit(request, user, "conn.test", conn=c, status="ERROR", statement=str(e)[:500])
        err = _db_error(e)
        return {"success": False, "message": err.detail}
    _audit(request, user, "conn.test", conn=c, status="OK", duration_ms=result["latencyMs"])
    return result


class ConnectionTestIn(ConnectionIn):
    existingId: Optional[str] = None


@app.post("/api/connections/test")
def test_unsaved(body: ConnectionTestIn, request: Request, admin: dict = Depends(admin_user)):
    """Tests parameters before saving. Without a password, reuses the one stored for existingId."""
    data = _validated(body)
    data.pop("existingId", None)
    if "password_enc" not in data and body.existingId:
        stored = store.get_connection(body.existingId)
        data["password_enc"] = stored["password_enc"] if stored else ""
    data.setdefault("password_enc", "")
    data.update(id=body.existingId, name=body.name)
    return _test(data, request, admin)


@app.post("/api/connections/{conn_id}/test")
def test_saved(conn_id: str, request: Request, user: dict = Depends(current_user)):
    return _test(_conn_or_404(conn_id), request, user)


# ── Query & catalog ─────────────────────────────────────────────────────────


class QueryIn(BaseModel):
    sql: str = Field(min_length=1, max_length=100_000)
    maxRows: Optional[int] = Field(default=None, ge=1)


@app.post("/api/connections/{conn_id}/query")
def query(conn_id: str, body: QueryIn, request: Request, user: dict = Depends(current_user)):
    c = _conn_or_404(conn_id)
    _rate_limit_queries(_ip(request))
    try:
        sqlguard.check(body.sql)
    except sqlguard.SqlRejected as e:
        _audit(request, user, "query.blocked", conn=c, statement=body.sql, status="BLOCKED")
        raise HTTPException(400, str(e))
    start = time.perf_counter()
    try:
        result = runner.run_query(c, body.sql, body.maxRows)
    except Exception as e:
        _audit(request, user, "query.error", conn=c, statement=body.sql, status="ERROR",
               duration_ms=int((time.perf_counter() - start) * 1000))
        raise _db_error(e)
    _audit(request, user, "query.ok", conn=c, statement=body.sql, status="OK",
           rows=result["rowCount"], duration_ms=result["durationMs"])
    return result


def _catalog(fn, *args):
    try:
        return fn(*args)
    except Exception as e:
        raise _db_error(e)


@app.get("/api/connections/{conn_id}/schemas")
def schemas(conn_id: str, _: dict = Depends(current_user)):
    return _catalog(runner.list_schemas, _conn_or_404(conn_id))


@app.get("/api/connections/{conn_id}/tables")
def tables(conn_id: str, schema: str, _: dict = Depends(current_user)):
    return _catalog(runner.list_tables, _conn_or_404(conn_id), schema)


@app.get("/api/connections/{conn_id}/columns")
def columns(conn_id: str, schema: str, table: str, _: dict = Depends(current_user)):
    return _catalog(runner.list_columns, _conn_or_404(conn_id), schema, table)


# ── Audit trail ─────────────────────────────────────────────────────────────


def _ip(request: Request) -> str:
    # Client-supplied forwarding headers are only trusted behind our own proxy.
    if config.TRUST_PROXY and request.headers.get("x-real-ip"):
        return request.headers["x-real-ip"].strip()
    return request.client.host if request.client else ""


def _audit(request: Request, user: dict, action: str, conn: dict = None, **kw):
    store.audit(username=user["username"], role=user["role"], action=action,
                connection_id=(conn or {}).get("id"), connection_name=(conn or {}).get("name"),
                client_ip=_ip(request), **kw)


@app.get("/api/audit")
def audit(limit: int = 500, user: dict = Depends(current_user)):
    entries = store.list_audit(min(limit, 5000))
    if user["role"] != "admin":
        entries = [e for e in entries if e["username"] == user["username"]]
    return entries


@app.get("/api/audit/verify")
def audit_verify(_: dict = Depends(admin_user)):
    return store.verify_audit()


# ── Administration (license, system info for support) ──────────────────────


class LicenseIn(BaseModel):
    key: str = Field(min_length=10, max_length=4000)


def _lan_addresses() -> list:
    """IPv4 addresses of this machine that other devices on the network can use."""
    import socket
    found = []
    try:  # primary interface (no packet is actually sent)
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("10.255.255.255", 1))
            found.append(s.getsockname()[0])
    except OSError:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            found.append(info[4][0])
    except OSError:
        pass
    return [ip for ip in dict.fromkeys(found) if not ip.startswith("127.")]


def _gateway_urls() -> list:
    urls = [config.PUBLIC_URL] if config.PUBLIC_URL else []
    if config.HOST not in ("127.0.0.1", "localhost", "::1"):
        urls += [f"http://{ip}:{config.PORT}" for ip in _lan_addresses()]
    return urls


@app.get("/api/admin/system")
def system_info(_: dict = Depends(admin_user)):
    java_ok, java_problem = drivers.get("ibmi").available()
    return {
        "product": "Plexa DB Gateway",
        "version": __version__,
        "gatewayId": config.GATEWAY_ID,
        "license": licensing.status(),
        "users": store.count_users(),
        "connections": store.count_connections(),
        "drivers": [{"key": d.key, "label": d.label, "available": d.available()[0]} for d in drivers.DRIVERS.values()],
        "ibmiReady": java_ok,
        "ibmiProblem": java_problem,
        "audit": store.verify_audit(),
        "publicDemo": config.PUBLIC_DEMO,
        "gatewayUrls": _gateway_urls(),
        "listensOnNetwork": config.HOST not in ("127.0.0.1", "localhost", "::1"),
    }


@app.get("/api/admin/license")
def license_status(_: dict = Depends(admin_user)):
    return licensing.status()


@app.post("/api/admin/license")
def license_activate(body: LicenseIn, request: Request, admin: dict = Depends(admin_user)):
    try:
        st = licensing.activate(body.key)
    except licensing.LicenseError as e:
        _audit(request, admin, "license.rejected", statement=str(e), status="ERROR")
        raise HTTPException(400, str(e))
    _audit(request, admin, "license.activate", statement=f"{st['licenseId']} {st['plan']} {st['customer']} -> {st['expires']}", status="OK")
    return st


@app.delete("/api/admin/license")
def license_remove(request: Request, admin: dict = Depends(admin_user)):
    licensing.remove()
    _audit(request, admin, "license.remove", status="OK")
    return licensing.status()


# ── Web client (built with `npm run build`) ─────────────────────────────────

if config.WEB_DIST.joinpath("index.html").exists():
    app.mount("/assets", StaticFiles(directory=config.WEB_DIST / "assets", check_dir=False), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def web_client(path: str):
        if path.startswith("api/"):
            raise HTTPException(404)
        candidate = (config.WEB_DIST / path).resolve()
        if path and candidate.is_file() and config.WEB_DIST.resolve() in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(config.WEB_DIST / "index.html")
