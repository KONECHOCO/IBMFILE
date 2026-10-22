"""Database drivers.

Every driver returns a standard DB-API 2.0 connection, opened in read-only mode
where the database supports it, and knows how to read its own catalog.
Python driver packages are imported lazily, so a missing package only disables
that one database type (see GET /api/drivers).
"""
import importlib
import sqlite3
import threading
from pathlib import Path

from . import config


class DriverUnavailable(RuntimeError):
    pass


def _require(module: str, pip_name: str):
    try:
        return importlib.import_module(module)
    except ImportError as e:
        raise DriverUnavailable(f"Missing Python driver: install '{pip_name}' on the gateway.") from e


class Driver:
    key = ""
    label = ""
    default_port = None
    module = ""
    pip = ""
    placeholder = "?"
    # Field hints for the client form
    uses_host = True
    database_label = "Database"
    read_only_note = "Session opened in read-only mode."

    def available(self):
        try:
            self.check_runtime()
            return True, None
        except DriverUnavailable as e:
            return False, str(e)

    def check_runtime(self):
        _require(self.module, self.pip)

    def connect(self, c: dict, password: str):
        raise NotImplementedError

    def test_sql(self) -> str:
        return "SELECT 1"

    # Catalog queries: (sql, params). Columns are aliased to fixed names.
    def schemas_sql(self):
        return ("SELECT schema_name AS name FROM information_schema.schemata ORDER BY 1", ())

    def tables_sql(self, schema):
        p = self.placeholder
        return (
            "SELECT table_name AS name, table_type AS type, '' AS description "
            f"FROM information_schema.tables WHERE table_schema = {p} ORDER BY 1",
            (schema,),
        )

    def columns_sql(self, schema, table):
        p = self.placeholder
        return (
            "SELECT column_name AS name, data_type AS type, character_maximum_length AS length, "
            "numeric_scale AS scale, is_nullable AS nullable, '' AS description "
            f"FROM information_schema.columns WHERE table_schema = {p} AND table_name = {p} "
            "ORDER BY ordinal_position",
            (schema, table),
        )

    def default_schema(self, c: dict):
        return c.get("database") or None

    def describe(self):
        ok, reason = self.available()
        return {
            "key": self.key,
            "label": self.label,
            "defaultPort": self.default_port,
            "usesHost": self.uses_host,
            "databaseLabel": self.database_label,
            "readOnlyNote": self.read_only_note,
            "available": ok,
            "unavailableReason": reason,
        }


# ── IBM i (Db2 for i) via JTOpen / JT400 JDBC ───────────────────────────────

_jvm_lock = threading.Lock()


class IbmIDriver(Driver):
    key = "ibmi"
    label = "IBM i (Db2 for i / AS400)"
    default_port = 446
    module = "jaydebeapi"
    pip = "JayDeBeApi JPype1 (+ Java 8+)"
    database_label = "Library list (e.g. QGPL, MYLIB)"
    read_only_note = "JT400 driver with access=read only: IBM i rejects any change."
    DRIVER_CLASS = "com.ibm.as400.access.AS400JDBCDriver"

    def check_runtime(self):
        _require("jaydebeapi", "JayDeBeApi")
        _require("jpype", "JPype1")
        if not Path(config.JT400_JAR).exists():
            raise DriverUnavailable(f"jt400.jar not found at {config.JT400_JAR} (PLEXA_JT400_JAR).")

    @staticmethod
    def url(c: dict) -> str:
        opts = c.get("options") or {}
        libs = [l.strip() for l in (c.get("database") or "").replace(";", ",").split(",") if l.strip()]
        # Port 446 (DRDA) is left out on purpose: JT400 uses the host server port
        # mapper (449) itself; forcing 446 breaks systems such as PUB400.COM.
        port = c.get("port")
        port_part = f":{port}" if port and int(port) != 446 else ""
        props = {
            "prompt": "false",
            "secure": "true" if c.get("ssl") else "false",
            "access": "read only",
            "naming": opts.get("naming", "sql"),
            "date format": "iso",
            "time format": "iso",
            "translate binary": "true",
            "login timeout": str(opts.get("loginTimeout", 15)),
            "query timeout mechanism": "cancel",
        }
        if libs:
            props["libraries"] = ",".join(libs)
        if opts.get("ccsid"):
            props["ccsid"] = str(opts["ccsid"])
        default_lib = libs[0] if libs else ""
        return f"jdbc:as400://{c['host']}{port_part}/{default_lib};" + ";".join(f"{k}={v}" for k, v in props.items())

    def connect(self, c, password):
        self.check_runtime()
        import jaydebeapi
        import jpype
        with _jvm_lock:
            if not jpype.isJVMStarted():
                jpype.startJVM(classpath=[str(config.JT400_JAR)], convertStrings=True)
        if not jpype.java.lang.Thread.isAttached():
            jpype.java.lang.Thread.attach()
        return jaydebeapi.connect(self.DRIVER_CLASS, self.url(c), [c.get("username") or "", password])

    def test_sql(self):
        return "SELECT CURRENT_SERVER AS SERVER, CURRENT_USER AS USER_NAME, CURRENT_TIMESTAMP AS NOW FROM SYSIBM.SYSDUMMY1"

    def schemas_sql(self):
        return ("SELECT SCHEMA_NAME AS NAME FROM QSYS2.SYSSCHEMAS ORDER BY 1", ())

    def tables_sql(self, schema):
        return (
            "SELECT TABLE_NAME AS NAME, TABLE_TYPE AS TYPE, COALESCE(TABLE_TEXT, '') AS DESCRIPTION "
            "FROM QSYS2.SYSTABLES WHERE TABLE_SCHEMA = ? ORDER BY 1",
            (schema.upper(),),
        )

    def columns_sql(self, schema, table):
        return (
            "SELECT COLUMN_NAME AS NAME, DATA_TYPE AS TYPE, LENGTH, NUMERIC_SCALE AS SCALE, "
            "IS_NULLABLE AS NULLABLE, COALESCE(COLUMN_TEXT, '') AS DESCRIPTION "
            "FROM QSYS2.SYSCOLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
            (schema.upper(), table.upper()),
        )

    def default_schema(self, c):
        libs = [l.strip() for l in (c.get("database") or "").replace(";", ",").split(",") if l.strip()]
        return libs[0].upper() if libs else (c.get("username") or "").upper() or None


# ── PostgreSQL ──────────────────────────────────────────────────────────────


class PostgresDriver(Driver):
    key = "postgres"
    label = "PostgreSQL"
    default_port = 5432
    module = "psycopg"
    pip = "psycopg[binary]"
    placeholder = "%s"
    read_only_note = "READ ONLY transactions enforced by the PostgreSQL server."

    def connect(self, c, password):
        psycopg = _require(self.module, self.pip)
        conn = psycopg.connect(
            host=c["host"], port=c.get("port") or self.default_port, dbname=c.get("database") or "postgres",
            user=c.get("username"), password=password, sslmode="require" if c.get("ssl") else "prefer",
            connect_timeout=15, options=f"-c statement_timeout={config.QUERY_TIMEOUT_S * 1000}",
        )
        conn.read_only = True
        return conn

    def schemas_sql(self):
        return ("SELECT schema_name AS name FROM information_schema.schemata "
                "WHERE schema_name NOT LIKE 'pg\\_%' AND schema_name <> 'information_schema' ORDER BY 1", ())

    def default_schema(self, c):
        return "public"


# ── MySQL / MariaDB ─────────────────────────────────────────────────────────


class MySqlDriver(Driver):
    key = "mysql"
    label = "MySQL / MariaDB"
    default_port = 3306
    module = "pymysql"
    pip = "PyMySQL"
    placeholder = "%s"
    read_only_note = "SET SESSION TRANSACTION READ ONLY on every connection."

    def connect(self, c, password):
        pymysql = _require(self.module, self.pip)
        conn = pymysql.connect(
            host=c["host"], port=int(c.get("port") or self.default_port), user=c.get("username"),
            password=password, database=c.get("database") or None, connect_timeout=15,
            read_timeout=config.QUERY_TIMEOUT_S, ssl={"ssl": {}} if c.get("ssl") else None, charset="utf8mb4",
        )
        with conn.cursor() as cur:
            cur.execute("SET SESSION TRANSACTION READ ONLY")
        return conn

    def schemas_sql(self):
        return ("SELECT schema_name AS name FROM information_schema.schemata "
                "WHERE schema_name NOT IN ('mysql','performance_schema','sys','information_schema') ORDER BY 1", ())


# ── Microsoft SQL Server (pure-Python TDS) ──────────────────────────────────


class MsSqlDriver(Driver):
    key = "mssql"
    label = "Microsoft SQL Server"
    default_port = 1433
    module = "pytds"
    pip = "python-tds"
    placeholder = "%s"
    read_only_note = "SQL Server has no read-only sessions: SQL guard + rollback. Use a login with db_datareader only."

    def connect(self, c, password):
        pytds = _require(self.module, self.pip)
        kwargs = dict(
            server=c["host"], port=int(c.get("port") or self.default_port), database=c.get("database") or "master",
            user=c.get("username"), password=password, login_timeout=15, timeout=config.QUERY_TIMEOUT_S,
            autocommit=False,
        )
        if c.get("ssl"):
            kwargs["cafile"] = (c.get("options") or {}).get("cafile") or None
            kwargs["validate_host"] = False
        return pytds.connect(**kwargs)

    def default_schema(self, c):
        return "dbo"


# ── Oracle (python-oracledb thin mode, no Instant Client needed) ────────────


class OracleDriver(Driver):
    key = "oracle"
    label = "Oracle Database"
    default_port = 1521
    module = "oracledb"
    pip = "oracledb"
    placeholder = ":1"
    database_label = "Service name (e.g. ORCLPDB1)"
    read_only_note = "SET TRANSACTION READ ONLY when the session opens."

    def connect(self, c, password):
        oracledb = _require(self.module, self.pip)
        protocol = "tcps" if c.get("ssl") else "tcp"
        dsn = (f"(DESCRIPTION=(ADDRESS=(PROTOCOL={protocol})(HOST={c['host']})(PORT={c.get('port') or 1521}))"
               f"(CONNECT_DATA=(SERVICE_NAME={c.get('database')})))")
        conn = oracledb.connect(user=c.get("username"), password=password, dsn=dsn, tcp_connect_timeout=15)
        conn.call_timeout = config.QUERY_TIMEOUT_S * 1000
        with conn.cursor() as cur:
            cur.execute("SET TRANSACTION READ ONLY")
        return conn

    def test_sql(self):
        return "SELECT 1 FROM DUAL"

    def schemas_sql(self):
        return ("SELECT username AS name FROM all_users WHERE oracle_maintained = 'N' ORDER BY 1", ())

    def tables_sql(self, schema):
        return ("SELECT table_name AS name, 'TABLE' AS type, '' AS description FROM all_tables WHERE owner = :1 "
                "UNION ALL SELECT view_name, 'VIEW', '' FROM all_views WHERE owner = :2 ORDER BY 1",
                (schema.upper(), schema.upper()))

    def columns_sql(self, schema, table):
        return ("SELECT column_name AS name, data_type AS type, data_length AS length, data_scale AS scale, "
                "nullable AS nullable, '' AS description FROM all_tab_columns "
                "WHERE owner = :1 AND table_name = :2 ORDER BY column_id",
                (schema.upper(), table.upper()))

    def default_schema(self, c):
        return (c.get("username") or "").upper() or None


# ── Snowflake ───────────────────────────────────────────────────────────────


class SnowflakeDriver(Driver):
    key = "snowflake"
    label = "Snowflake"
    default_port = 443
    module = "snowflake.connector"
    pip = "snowflake-connector-python"
    placeholder = "%s"
    database_label = "Database (account in the host field, e.g. xy12345.eu-west-1)"
    read_only_note = "SQL guard + role: give the user a read-only Snowflake role."

    def connect(self, c, password):
        sf = _require(self.module, self.pip)
        opts = c.get("options") or {}
        account = c["host"].replace(".snowflakecomputing.com", "")
        return sf.connect(
            account=account, user=c.get("username"), password=password, database=c.get("database") or None,
            warehouse=opts.get("warehouse"), role=opts.get("role"), login_timeout=20,
            network_timeout=config.QUERY_TIMEOUT_S,
        )

    def default_schema(self, c):
        return "PUBLIC"


# ── SQLite (local files; used for the built-in demo database) ───────────────


class SqliteDriver(Driver):
    key = "sqlite"
    label = "SQLite (file on the gateway)"
    module = "sqlite3"
    pip = "(bundled with Python)"
    uses_host = False
    database_label = "Path of the .sqlite file on the gateway"
    read_only_note = "File opened with mode=ro: the engine rejects any write."

    def connect(self, c, password):
        path = Path(c.get("database") or "")
        if not path.is_absolute():
            path = config.DATA_DIR / path
        if not path.exists():
            raise FileNotFoundError(f"SQLite file not found: {path}")
        return sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True, timeout=10, check_same_thread=False)

    def schemas_sql(self):
        return ("SELECT 'main' AS name", ())

    def tables_sql(self, schema):
        return ("SELECT name, UPPER(type) AS type, '' AS description FROM sqlite_master "
                "WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY 1", ())

    def columns_sql(self, schema, table):
        return ("SELECT name, type, NULL AS length, NULL AS scale, "
                "CASE WHEN \"notnull\" = 1 THEN 'NO' ELSE 'YES' END AS nullable, '' AS description "
                "FROM pragma_table_info(?)", (table,))

    def default_schema(self, c):
        return "main"


DRIVERS = {d.key: d for d in (
    IbmIDriver(), PostgresDriver(), MySqlDriver(), MsSqlDriver(), OracleDriver(), SnowflakeDriver(), SqliteDriver(),
)}


def get(key: str) -> Driver:
    try:
        return DRIVERS[key]
    except KeyError:
        raise DriverUnavailable(f"Unknown database type: {key}")
