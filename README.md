# Plexa DB

Read-only multi-database SQL client for **web, iOS and Android**: IBM i (Db2 for i / AS400),
PostgreSQL, MySQL/MariaDB, SQL Server, Oracle and Snowflake, in 6 languages
(it, en, es, fr, de, ja).

Bundle id: `com.ikonet.plexadb` · © 2026 Ikonet Solutions

## How it works

```
 Web app / iOS / Android  ──HTTPS──▶  Plexa DB Gateway  ──JDBC / native drivers──▶  your databases
     (this repo, React)               (gateway/, Python)
```

The app never connects to a database directly. It signs in to the **gateway**,
which keeps the connections (passwords encrypted), runs read-only queries,
reads the catalog and writes a tamper-evident audit trail. See [gateway/README.md](gateway/README.md).

## Modules

| Module | Status |
|---|---|
| Query Studio — visual wizard, SQL editor, ready-made queries per database, table/chart, CSV/JSON/Excel export | real |
| Connections — create, test, edit connections; read-only notes per driver | real |
| Data catalog — schemas/libraries, tables, views, columns | real |
| Audit — every sign-in, test and query, SHA-256 hash chain with verification | real |
| Port Guard, Scheduled reports | not shown yet (components kept for a later release) |
| Administration (admins only) — users and roles, password reset, license activation, system info for support | real |

A **demo database** (SQLite with fictional sample data, always marked "DEMO")
is created by the gateway so the app can be tried without your own database.

## Development

```bash
# 1. Gateway (terminal 1)
cd gateway
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python run.py          # prints the setup code on first start

# 2. Web app (terminal 2)
npm install
npm run dev                          # http://localhost:5173, /api proxied to the gateway
```

Leave the gateway address empty on the sign-in screen when using `npm run dev`
or the web build served by the gateway.

## Builds

- **Web**: `npm run build`, then the gateway serves `dist/` at `/` (or use the Docker image in `gateway/Dockerfile`).
- **Mobile (iOS / Android, Capacitor 8)**: `npm run build`, then
  `npx -y node@22 node_modules/@capacitor/cli/bin/capacitor sync` (the Capacitor CLI needs Node 22).
  Android debug build: `cd android && gradlew assembleDebug`. iOS builds run on Codemagic (no Mac needed).
  - The app starts on the public demo gateway; users enter or **scan** (QR) their company gateway address.
    Admins show the QR in **Administration → Devices**.
  - Company gateways on the LAN/VPN may use plain `http://`: iOS allows it for local-network addresses only
    (`NSAllowsLocalNetworking`), Android via `network_security_config.xml` + `allowMixedContent`.
  - For phones to reach a gateway, start it with `PLEXA_HOST=0.0.0.0` (and allow port 8787 in the firewall).

## Trademarks

IBM i, Db2, AS/400 and the other database names are trademarks of their owners and are
used only to describe compatibility. Plexa DB is not affiliated with or endorsed by them.

## Microsoft Store (Windows desktop app)

`desktop/` packages the app as an MSIX: a C# shell (WebView2) that starts the bundled gateway and a
reduced Java runtime for IBM i. Build with `powershell -ExecutionPolicy Bypass -File desktop\build.ps1`.

Plans are bought only through the Store and read by the shell (`StoreLicense.cs`):
the app itself is **Pro** (paid, with a 7-day free trial) and **Business** is an add-on subscription
with product ID `plexa_business`. Trial and Pro keep the gateway on this PC (`127.0.0.1`);
only Business opens it to the office network.
