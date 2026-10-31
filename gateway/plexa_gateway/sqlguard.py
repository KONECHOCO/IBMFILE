"""Read-only SQL guard.

This is the first of two layers: every driver also opens the session in
read-only mode where the database supports it (see drivers/*). The guard
alone is not a security boundary — the database user should be read-only too.

Databases disagree on what counts as a comment or a string, and text hidden
from the guard could still run on the server. So every statement is read the
way each family of databases would read it, and must pass all of the readings.
"""
import re

ALLOWED_STARTERS = {"SELECT", "WITH", "VALUES", "SHOW", "DESCRIBE", "DESC", "EXPLAIN"}

# REPLACE is deliberately absent: it is also a common scalar function.
# The second group runs without a ';' on SQL Server or from inside a SELECT.
BLOCKED = re.compile(
    r"\b(DELETE|DROP|TRUNCATE|INSERT|UPDATE|ALTER|CREATE|EXEC|EXECUTE|GRANT|REVOKE|"
    r"CALL|MERGE|RENAME|INTO|LOCK|UPSERT|COPY|ATTACH|DETACH|PRAGMA|VACUUM|REINDEX|"
    r"DENY|COMMIT|SHUTDOWN|DBCC|WRITETEXT|UPDATETEXT|KILL\s+\d+|BACKUP\s+(?:DATABASE|LOG)|"
    r"RESTORE\s+(?:DATABASE|LOG)|OPENROWSET|OPENDATASOURCE|OPENQUERY|OUTFILE|DUMPFILE|"
    r"XP_\w+|SP_\w+|QCMDEXC|DBLINK\w*|PG_TERMINATE_BACKEND|PG_CANCEL_BACKEND|PG_RELOAD_CONF|"
    r"LO_UNLINK|LO_IMPORT|LO_EXPORT)\b",
    re.IGNORECASE,
)

_PROFILES = (
    {"quotes": "'\"", "dollar": True},  # IBM i, PostgreSQL, Oracle, Snowflake, SQLite
    {"quotes": "'\"`", "backslash": True, "hash_comment": True, "dash_needs_space": True},  # MySQL, MariaDB
    {"quotes": "'\"["},  # SQL Server
)
_DOLLAR_TAG = re.compile(r"\$(?:[A-Za-z_]\w*)?\$")
_ORACLE_Q_PREFIX = re.compile(r"(?<![\w$#@])[nN]?[qQ]$")


class SqlRejected(ValueError):
    pass


def _strip(sql: str, quotes: str, backslash=False, hash_comment=False, dash_needs_space=False, dollar=False) -> str:
    """Remove comments and quoted literals/identifiers so keywords inside them don't count.

    Anything left unterminated stays visible: another database may not see it as open.
    """
    out = []
    i, n = 0, len(sql)
    while i < n:
        c = sql[i]
        tag = _DOLLAR_TAG.match(sql, i) if dollar and c == "$" else None
        if sql.startswith("--", i) and not (dash_needs_space and i + 2 < n and not sql[i + 2].isspace()):
            j = sql.find("\n", i)
            i = n if j < 0 else j
            out.append(" ")
        elif c == "#" and hash_comment:
            j = sql.find("\n", i)
            i = n if j < 0 else j
            out.append(" ")
        elif sql.startswith("/*", i):
            if sql.startswith(("/*!", "/*M!"), i):
                raise SqlRejected("Executable comments are not allowed in read-only mode.")
            j = sql.find("*/", i + 2)
            if j < 0:
                out.append(sql[i:])
                break
            if "/*" in sql[i + 2:j]:
                raise SqlRejected("Nested comments are not allowed in read-only mode.")
            i = j + 2
            out.append(" ")
        elif tag:
            j = sql.find(tag.group(), tag.end())
            if j < 0:
                out.append(sql[i:])
                break
            i = j + len(tag.group())
            out.append(" ? ")
        elif c in quotes:
            if c == "'" and _ORACLE_Q_PREFIX.search(sql[max(0, i - 3):i]):
                raise SqlRejected("Oracle q-quoted strings are not allowed in read-only mode.")
            close = "]" if c == "[" else c
            j = i + 1
            while j < n:
                if backslash and sql[j] == "\\":
                    j += 2
                    continue
                if sql[j] == close:
                    if j + 1 < n and sql[j + 1] == close and close != "]":  # escaped '' or ""
                        j += 2
                        continue
                    break
                j += 1
            if j >= n:
                out.append(sql[i:])
                break
            i = j + 1
            out.append(" ? ")
        else:
            out.append(c)
            i += 1
    return "".join(out)


def _check_reading(stripped: str) -> None:
    stripped = stripped.strip()
    while stripped.endswith(";"):
        stripped = stripped[:-1].rstrip()
    if not stripped:
        raise SqlRejected("Empty SQL statement.")
    if ";" in stripped:
        raise SqlRejected("Only one statement per execution is allowed.")
    first = stripped.split(None, 1)[0].upper().lstrip("(")
    if first not in ALLOWED_STARTERS:
        raise SqlRejected(f"'{first}' is not allowed: Plexa DB only runs read-only queries (SELECT, WITH, VALUES).")
    hit = BLOCKED.search(stripped)
    if hit:
        raise SqlRejected(f"'{hit.group().upper()}' is not allowed in read-only mode.")


def check(sql: str) -> str:
    """Return the cleaned statement (without trailing ';') or raise SqlRejected."""
    for profile in _PROFILES:
        _check_reading(_strip(sql, **profile))
    statement = sql.strip()
    while statement.endswith(";"):
        statement = statement[:-1].rstrip()
    return statement
