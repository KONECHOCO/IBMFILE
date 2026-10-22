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
])
def test_writes_are_blocked(client, admin, demo_id, sql):
    r = client.post(f"/api/connections/{demo_id}/query", headers=admin, json={"sql": sql})
    assert r.status_code == 400


@pytest.mark.parametrize("sql", [
    "SELECT REPLACE(COMPANY_NAME, 'a', 'b') FROM CUSTOMERS",
    "SELECT * FROM CUSTOMERS WHERE COMPANY_NAME = 'DELETE; DROP'",
    "SELECT 1 -- delete me\n;",
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
