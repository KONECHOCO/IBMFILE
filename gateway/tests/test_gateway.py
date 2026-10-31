import os
import re
import tempfile

os.environ["PLEXA_DATA_DIR"] = tempfile.mkdtemp(prefix="plexa-test-")
os.environ["PLEXA_DEMO"] = "1"

import pytest
from fastapi.testclient import TestClient

from plexa_gateway import main, sqlguard, store


@pytest.fixture(scope="module")
def client():
    with TestClient(main.app) as c:
        yield c


@pytest.fixture(scope="module")
def admin(client):
    r = client.post("/api/auth/setup", json={"username": "admin", "password": "wrong-code-1",
                                             "setupCode": "not-the-code"})
    assert r.status_code == 403
    r = client.post("/api/auth/setup", json={"username": "admin", "password": "s3cret-pass",
                                             "setupCode": main.SETUP_CODE["value"]})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def demo_id(client, admin):
    conns = client.get("/api/connections", headers=admin).json()
    return next(c["id"] for c in conns if c["isDemo"])


def test_requires_login(client):
    assert client.get("/api/connections").status_code == 401


def test_setup_only_once(client, admin):
    r = client.post("/api/auth/setup", json={"username": "other", "password": "s3cret-pass", "setupCode": "1"})
    assert r.status_code == 409


def test_query_returns_real_rows(client, admin, demo_id):
    r = client.post(f"/api/connections/{demo_id}/query", headers=admin,
                    json={"sql": "SELECT COUNTRY, COUNT(*) AS N FROM CUSTOMERS GROUP BY COUNTRY ORDER BY N DESC"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["columns"] == ["COUNTRY", "N"]
    assert sum(row[1] for row in body["rows"]) == 20


def test_different_sql_gives_different_results(client, admin, demo_id):
    a = client.post(f"/api/connections/{demo_id}/query", headers=admin, json={"sql": "SELECT COUNT(*) FROM ORDERS"})
    b = client.post(f"/api/connections/{demo_id}/query", headers=admin, json={"sql": "SELECT COUNT(*) FROM PRODUCTS"})
    assert a.json()["rows"] == [[400]]
    assert b.json()["rows"] == [[12]]


def test_row_limit_and_truncation(client, admin, demo_id):
    r = client.post(f"/api/connections/{demo_id}/query", headers=admin,
                    json={"sql": "SELECT * FROM ORDER_LINES", "maxRows": 10})
    body = r.json()
    assert body["rowCount"] == 10 and body["truncated"] is True


def test_sql_error_is_reported_not_faked(client, admin, demo_id):
    r = client.post(f"/api/connections/{demo_id}/query", headers=admin, json={"sql": "SELECT * FROM NOPE"})
    assert r.status_code == 502
    assert "no such table" in r.json()["detail"]


@pytest.mark.parametrize("sql", [
    "DELETE FROM CUSTOMERS",
    "UPDATE CUSTOMERS SET STATUS='X'",
    "SELECT 1; DROP TABLE CUSTOMERS",
    "WITH x AS (DELETE FROM ORDERS RETURNING *) SELECT * FROM x",
    "SELECT * INTO COPY_T FROM CUSTOMERS",
    "PRAGMA writable_schema=1",
    "drop table CUSTOMERS",
    "/* x */ TRUNCATE TABLE CUSTOMERS",
    # Hidden from a naive reading, but executed by the database named in the comment
    "SELECT 1 /*! INTO OUTFILE '/tmp/x' */",                    # MySQL executable comment
    "SELECT 1--1 INTO OUTFILE '/tmp/x'",                        # MySQL: not a comment without a space
    "SELECT 1 # '\n INTO OUTFILE 'x'",                          # MySQL: # comment before a quote
    "SELECT 'a\\' , ' ; DROP TABLE t ; -- '",                   # MySQL: backslash escape
    "SELECT $$'$$ ; DROP TABLE t ; --'",                        # PostgreSQL: dollar quoting
    "SELECT 1 /* /* */ ' */ ; DROP TABLE t ; --'",              # PostgreSQL: nested comments
    "SELECT q'[ ' ]' FROM DUAL ; DROP TABLE t --'",             # Oracle: q-quoted string
    "SELECT 1 [ ; DROP TABLE t ; ]",                            # '[' only quotes on SQL Server
    # No ';' needed on SQL Server, or run from inside a SELECT
    "SELECT 1 SHUTDOWN",
    "SELECT 1 KILL 55",
    "SELECT 1 BACKUP DATABASE x TO DISK = 'y'",
    "SELECT * FROM OPENROWSET('a', 'b', 'c')",
    "SELECT xp_cmdshell",
    "SELECT QSYS2.QCMDEXC('DLTF LIB/FILE') FROM SYSIBM.SYSDUMMY1",  # IBM i: runs a CL command
    "SELECT pg_terminate_backend(1)",
])
def test_writes_are_blocked(client, admin, demo_id, sql):
    r = client.post(f"/api/connections/{demo_id}/query", headers=admin, json={"sql": sql})
    assert r.status_code == 400


@pytest.mark.parametrize("sql", [
    "SELECT REPLACE(COMPANY_NAME, 'a', 'b') FROM CUSTOMERS",
    "SELECT * FROM CUSTOMERS WHERE COMPANY_NAME = 'DELETE; DROP'",
    "SELECT 1 -- delete me\n;",
    "SELECT * FROM CUSTOMERS /* drop */ WHERE NOTE = 'it''s a DELETE'",
    "SELECT CUST#, ORD$ FROM MYLIB.ORDERS# WHERE PATH = 'C:\\temp\\'",
    "SELECT \"DELETE\" FROM T WHERE X = 'UPDATE'",
    "WITH a AS (SELECT 1 AS X) SELECT * FROM a",
    "SELECT UPDATED_AT, DROPPED, DELETED_FLAG FROM T",
    "SELECT * FROM QSYS2.ACTIVE_JOB_INFO()",
])
def test_guard_has_no_false_positives(sql):
    sqlguard.check(sql)


def test_catalog(client, admin, demo_id):
    tables = client.get(f"/api/connections/{demo_id}/tables", params={"schema": "main"}, headers=admin).json()
    names = {t["name"] for t in tables}
    assert {"CUSTOMERS", "ORDERS", "V_SALES_BY_COUNTRY"} <= names
    cols = client.get(f"/api/connections/{demo_id}/columns", params={"schema": "main", "table": "ORDERS"},
                      headers=admin).json()
    assert cols[0]["name"] == "ORDER_ID"


def test_unreachable_host_fails_honestly(client, admin):
    r = client.post("/api/connections/test", headers=admin, json={
        "name": "x", "driver": "postgres", "host": "127.0.0.1", "port": 1, "database": "x",
        "username": "x", "password": "x"})
    assert r.status_code == 200
    assert r.json()["success"] is False


def test_password_never_returned(client, admin):
    r = client.post("/api/connections", headers=admin, json={
        "name": "PG", "driver": "postgres", "host": "db.example", "database": "x",
        "username": "u", "password": "top-secret"})
    assert r.status_code == 200
    assert "top-secret" not in r.text and "password_enc" not in r.text
    assert r.json()["hasPassword"] is True and r.json()["port"] == 5432
    raw = store.get_connection(r.json()["id"])["password_enc"]
    assert raw and "top-secret" not in raw


def test_non_admin_cannot_manage_connections(client, admin):
    client.post("/api/users", headers=admin, json={"username": "mario", "password": "analyst-pass", "role": "analyst"})
    tok = client.post("/api/auth/login", json={"username": "mario", "password": "analyst-pass"}).json()["token"]
    h = {"Authorization": f"Bearer {tok}"}
    assert client.get("/api/connections", headers=h).status_code == 200
    assert client.post("/api/connections", headers=h, json={"name": "x", "driver": "sqlite"}).status_code == 403


def test_audit_chain_is_tamper_evident(client, admin):
    assert client.get("/api/audit/verify", headers=admin).json()["valid"] is True
    with store.connect() as db:
        db.execute("UPDATE audit SET rows = 999 WHERE seq = (SELECT MIN(seq) FROM audit WHERE action='query.ok')")
    v = client.get("/api/audit/verify", headers=admin).json()
    assert v["valid"] is False and v["broken_at"] is not None


def test_ibmi_url_is_read_only():
    from plexa_gateway.drivers import IbmIDriver
    url = IbmIDriver.url({"host": "pub400.com", "port": 446, "database": "qiws, qgpl", "ssl": False})
    assert url.startswith("jdbc:as400://pub400.com/qiws;")
    assert "access=read only" in url and "libraries=qiws,qgpl" in url
    assert re.search(r"pub400\.com:\d", url) is None


def test_public_demo_mode(monkeypatch):
    from plexa_gateway import config
    monkeypatch.setattr(config, "PUBLIC_DEMO", True)
    monkeypatch.setattr(config, "QUERIES_PER_MINUTE", 3)
    main._QUERY_TIMES.clear()
    with TestClient(main.app) as c:
        h = c.get("/api/health").json()
        assert h["publicDemo"] is True and h["setupRequired"] is False
        creds = h["demoCredentials"]
        tok = c.post("/api/auth/login", json=creds).json()["token"]
        auth = {"Authorization": f"Bearer {tok}"}
        assert c.get("/api/auth/me", headers=auth).json()["role"] == "analyst"
        # the demo account cannot add connections (no way to reach other hosts)
        assert c.post("/api/connections", headers=auth, json={"name": "x", "driver": "sqlite"}).status_code == 403
        assert c.post("/api/connections/test", headers=auth, json={"name": "x", "driver": "postgres", "host": "10.0.0.1"}).status_code == 403
        demo_id = next(x["id"] for x in c.get("/api/connections", headers=auth).json() if x["isDemo"])
        codes = [c.post(f"/api/connections/{demo_id}/query", headers=auth, json={"sql": "SELECT 1"}).status_code for _ in range(4)]
        assert codes == [200, 200, 200, 429]
    main._QUERY_TIMES.clear()


def test_sqlite_long_query_is_interrupted(monkeypatch):
    from plexa_gateway import config, runner
    monkeypatch.setattr(config, "QUERY_TIMEOUT_S", 1)
    demo_conn = next(c for c in store.list_connections() if c["is_demo"])
    with pytest.raises(Exception, match="interrupt"):
        runner.run_query(demo_conn, "SELECT COUNT(*) FROM ORDER_LINES a, ORDER_LINES b, ORDER_LINES c")


# ── Licenses ────────────────────────────────────────────────────────────────

def _test_signer(monkeypatch):
    """Swap the embedded public key for a throwaway one and return a signer."""
    import base64, json as _json
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from plexa_gateway import licensing
    key = Ed25519PrivateKey.generate()
    pub = key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    monkeypatch.setattr(licensing, "PUBLIC_KEY", base64.b64encode(pub).decode())
    b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b"=").decode()

    def sign(payload, signer=key):
        body = _json.dumps(payload).encode()
        return f"PLEXA1.{b64(body)}.{b64(signer.sign(body))}"
    return sign


def test_license_lifecycle(client, admin, monkeypatch):
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from plexa_gateway import config
    sign = _test_signer(monkeypatch)
    st = client.get("/api/admin/license", headers=admin).json()
    assert st["plan"] == "community" and st["gatewayId"] == config.GATEWAY_ID

    forged = sign({"lid": "X", "plan": "business"}, signer=Ed25519PrivateKey.generate())
    assert client.post("/api/admin/license", headers=admin, json={"key": forged}).status_code == 400
    other_gw = sign({"lid": "X", "plan": "business", "gatewayId": "GW-OTHER"})
    assert "another gateway" in client.post("/api/admin/license", headers=admin, json={"key": other_gw}).json()["detail"]
    expired = sign({"lid": "X", "plan": "business", "gatewayId": "*", "expires": "2020-01-01"})
    assert "expired" in client.post("/api/admin/license", headers=admin, json={"key": expired}).json()["detail"]

    good = sign({"lid": "LIC-1", "customer": "ACME", "plan": "business", "maxUsers": None, "maxConnections": 10,
                 "gatewayId": config.GATEWAY_ID, "expires": "2099-12-31"})
    r = client.post("/api/admin/license", headers=admin, json={"key": good})
    assert r.status_code == 200 and r.json()["customer"] == "ACME" and r.json()["maxConnections"] == 10
    info = client.get("/api/admin/system", headers=admin).json()
    assert info["license"]["valid"] and "valid" in info["audit"]  # chain was tampered by an earlier test
    client.delete("/api/admin/license", headers=admin)
    assert client.get("/api/admin/license", headers=admin).json()["plan"] == "community"


def test_community_limits(client, admin, monkeypatch):
    from plexa_gateway import licensing
    monkeypatch.setattr(licensing, "COMMUNITY", {"plan": "community", "maxUsers": store.count_users(), "maxConnections": 0})
    r = client.post("/api/users", headers=admin, json={"username": "extra1", "password": "extra-pass1", "role": "viewer"})
    assert r.status_code == 402 and "Limit reached" in r.json()["detail"]
    r = client.post("/api/connections", headers=admin, json={"name": "y", "driver": "sqlite", "database": "x"})
    assert r.status_code == 402


def test_user_update_and_last_admin(client, admin):
    me = client.get("/api/auth/me", headers=admin).json()
    assert client.put(f"/api/users/{me['id']}", headers=admin, json={"role": "viewer"}).status_code == 400
    mario = next(u for u in client.get("/api/users", headers=admin).json() if u["username"] == "mario")
    assert client.put(f"/api/users/{mario['id']}", headers=admin, json={"role": "viewer", "password": "new-pass-123"}).json()["role"] == "viewer"
    assert client.post("/api/auth/login", json={"username": "mario", "password": "new-pass-123"}).status_code == 200


def test_cli_reset_password(monkeypatch, capsys):
    from plexa_gateway import cli
    monkeypatch.setattr(cli.getpass, "getpass", lambda prompt="": "cli-pass-123")
    assert cli.main(["reset-password", "mario"]) == 0
    assert "Password changed" in capsys.readouterr().out


# ── Microsoft Store mode ────────────────────────────────────────────────────

def test_store_mode_plans(client, admin, demo_id, monkeypatch):
    from plexa_gateway import config, licensing
    monkeypatch.setattr(config, "STORE_MODE", True)
    monkeypatch.setattr(config, "SHELL_TOKEN", "shell-secret")
    push = lambda plan, tok="shell-secret": client.post("/api/internal/store-license", json={"plan": plan, "expires": "2030-01-01"}, headers={"X-Plexa-Shell-Token": tok})
    run = lambda: client.post(f"/api/connections/{demo_id}/query", headers=admin, json={"sql": "SELECT 1"}).status_code
    try:
        assert all(d["available"] for d in client.get("/api/drivers", headers=admin).json())
        assert push("business", "wrong").status_code == 403
        assert push("nonsense").status_code == 400

        assert push("expired").status_code == 200
        assert run() == 402
        assert client.get(f"/api/connections/{demo_id}/schemas", headers=admin).status_code == 402
        assert client.get("/api/license", headers=admin).json()["valid"] is False

        assert push("trial").status_code == 200
        assert run() == 200
        assert client.get("/api/license", headers=admin).json()["maxUsers"] == 1
        r = client.post("/api/users", headers=admin, json={"username": "storeuser", "password": "store-pass-1", "role": "viewer"})
        assert r.status_code == 402 and "Upgrade" in r.json()["detail"]

        assert push("pro").status_code == 200
        assert client.get("/api/license", headers=admin).json()["maxConnections"] is None
        assert client.post("/api/users", headers=admin, json={"username": "storeuser", "password": "store-pass-1", "role": "viewer"}).status_code == 402

        assert push("business").status_code == 200
        assert client.post("/api/users", headers=admin, json={"username": "storeuser", "password": "store-pass-1", "role": "viewer"}).status_code == 200
        assert client.post("/api/admin/license", headers=admin, json={"key": "PLEXA1.aaaa.bbbb"}).status_code == 400
    finally:
        licensing.set_store_entitlement("pending")


def test_store_endpoint_closed_outside_store_mode(client):
    assert client.post("/api/internal/store-license", json={"plan": "business"}, headers={"X-Plexa-Shell-Token": ""}).status_code == 403
