# Plexa DB Gateway

The server that connects the Plexa DB web and mobile apps to real databases.
The apps never talk to a database directly: they sign in to the gateway, and
the gateway runs read-only queries with the stored (encrypted) credentials.

| Database | Python driver | Read-only enforcement |
|---|---|---|
| IBM i (Db2 for i / AS400) | JayDeBeApi + JT400 (`lib/jt400.jar`, needs Java 8+) | `access=read only` on the JDBC connection |
| PostgreSQL | psycopg 3 | `READ ONLY` transactions |
| MySQL / MariaDB | PyMySQL | `SET SESSION TRANSACTION READ ONLY` |
| SQL Server | python-tds | SQL guard + rollback (use a `db_datareader` login) |
| Oracle | python-oracledb (thin, no Instant Client) | `SET TRANSACTION READ ONLY` |
| Snowflake | snowflake-connector-python (optional) | SQL guard + read-only role |
| SQLite | built in | file opened with `mode=ro` (used for the demo database) |

Every statement also passes the SQL guard (`plexa_gateway/sqlguard.py`):
one statement, starting with SELECT / WITH / VALUES / SHOW / DESCRIBE / EXPLAIN,
no DML/DDL keywords outside string literals. The guard is a second layer:
give the gateway a read-only database user too.

## Run

```bash
cd gateway
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt     # Linux/macOS: .venv/bin/pip
.venv/Scripts/python run.py
```

On first start the console prints a **setup code**: open the app, enter the
gateway address, and create the administrator with that code.

Settings: see `.env.example`. Data (users, connections, audit, keys) is in `data/`.
Back up `data/vault.key`: without it the stored database passwords cannot be decrypted.

## Docker (gateway + web client)

```bash
docker build -f gateway/Dockerfile -t plexa-gateway .
docker run -p 8787:8787 -v plexa-data:/data plexa-gateway
```

Open http://localhost:8787 for the web version. Put HTTPS in front of it
(reverse proxy) before exposing it outside your network: the mobile apps
require HTTPS.

## API

| Method | Path | Who |
|---|---|---|
| GET | `/api/health` | anyone |
| POST | `/api/auth/setup`, `/api/auth/login` | anyone |
| GET | `/api/connections`, `/api/drivers` | signed in |
| POST/PUT/DELETE | `/api/connections[/{id}]` | admin |
| POST | `/api/connections/test` (draft), `/api/connections/{id}/test` | admin / signed in |
| POST | `/api/connections/{id}/query` `{sql, maxRows}` | signed in |
| GET | `/api/connections/{id}/schemas`, `/tables?schema=`, `/columns?schema=&table=` | signed in |
| GET | `/api/audit`, `/api/audit/verify` | signed in (own entries) / admin |
| GET/POST/DELETE | `/api/users` | admin |

The audit trail is a hash chain: each entry stores the SHA-256 of the previous
entry plus its own content, so `/api/audit/verify` detects any edited or deleted row.

## Tests

```bash
.venv/Scripts/python -m pytest tests
```
