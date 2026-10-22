"""Executes statements on a saved connection and converts results to JSON-safe values."""
import base64
import datetime as dt
import decimal
import time
import uuid

from . import config, drivers, sqlguard
from .security import decrypt


def _json_value(v):
    if v is None or isinstance(v, (bool, int, float, str)):
        return v
    if isinstance(v, decimal.Decimal):
        # Keep exact text for values a float cannot hold exactly enough.
        return float(v) if len(v.as_tuple().digits) <= 15 else str(v)
    if isinstance(v, (dt.datetime, dt.date, dt.time)):
        return v.isoformat()
    if isinstance(v, dt.timedelta):
        return str(v)
    if isinstance(v, (bytes, bytearray, memoryview)):
        return "base64:" + base64.b64encode(bytes(v)).decode()
    if isinstance(v, uuid.UUID):
        return str(v)
    return str(v)


def _close(conn):
    try:
        conn.rollback()
    except Exception:
        pass
    try:
        conn.close()
    except Exception:
        pass


def _execute(conn, sql, params, max_rows):
    cur = conn.cursor()
    try:
        if params:
            cur.execute(sql, params)
        else:
            cur.execute(sql)
        if not cur.description:
            return [], [], False
        columns = [str(d[0]) for d in cur.description]
        raw = cur.fetchmany(max_rows + 1) if max_rows else cur.fetchall()
        truncated = bool(max_rows) and len(raw) > max_rows
        rows = [[_json_value(v) for v in r] for r in raw[:max_rows or None]]
        return columns, rows, truncated
    finally:
        try:
            cur.close()
        except Exception:
            pass


def open_connection(c: dict):
    driver = drivers.get(c["driver"])
    return driver, driver.connect(c, decrypt(c.get("password_enc", "")))


def run_query(c: dict, sql: str, max_rows: int = None) -> dict:
    statement = sqlguard.check(sql)
    max_rows = min(max_rows or config.MAX_ROWS, config.MAX_ROWS)
    driver, conn = open_connection(c)
    try:
        start = time.perf_counter()
        columns, rows, truncated = _execute(conn, statement, None, max_rows)
        elapsed = int((time.perf_counter() - start) * 1000)
    finally:
        _close(conn)
    return {"columns": columns, "rows": rows, "rowCount": len(rows), "truncated": truncated,
            "maxRows": max_rows, "durationMs": elapsed}


def _catalog(c: dict, build):
    driver, conn = open_connection(c)
    try:
        sql, params = build(driver)
        columns, rows, _ = _execute(conn, sql, params, 0)
    finally:
        _close(conn)
    keys = [col.lower() for col in columns]
    return [dict(zip(keys, r)) for r in rows]


def list_schemas(c):
    return [r["name"] for r in _catalog(c, lambda d: d.schemas_sql())]


def list_tables(c, schema):
    return _catalog(c, lambda d: d.tables_sql(schema))


def list_columns(c, schema, table):
    return _catalog(c, lambda d: d.columns_sql(schema, table))


def test_connection(c: dict) -> dict:
    start = time.perf_counter()
    driver, conn = open_connection(c)
    try:
        connected_ms = int((time.perf_counter() - start) * 1000)
        columns, rows, _ = _execute(conn, driver.test_sql(), None, 1)
    finally:
        _close(conn)
    return {
        "success": True,
        "latencyMs": connected_ms,
        "serverInfo": dict(zip(columns, rows[0])) if rows else {},
        "defaultSchema": driver.default_schema(c),
        "readOnlyNote": driver.read_only_note,
    }
