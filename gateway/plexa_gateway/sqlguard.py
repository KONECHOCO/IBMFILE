"""Read-only SQL guard.

This is the first of two layers: every driver also opens the session in
read-only mode where the database supports it (see drivers/*). The guard
alone is not a security boundary — the database user should be read-only too.
"""
import re

ALLOWED_STARTERS = {"SELECT", "WITH", "VALUES", "SHOW", "DESCRIBE", "DESC", "EXPLAIN"}

# REPLACE is deliberately absent: it is also a common scalar function.
BLOCKED = re.compile(
    r"\b(DELETE|DROP|TRUNCATE|INSERT|UPDATE|ALTER|CREATE|EXEC|EXECUTE|GRANT|REVOKE|"
    r"CALL|MERGE|RENAME|INTO|LOCK|UPSERT|COPY|ATTACH|DETACH|PRAGMA|VACUUM|REINDEX)\b",
    re.IGNORECASE,
)


class SqlRejected(ValueError):
    pass


def _strip(sql: str) -> str:
    """Remove comments and quoted literals/identifiers so keywords inside them don't count."""
    out = []
    i, n = 0, len(sql)
    while i < n:
        c = sql[i]
        if sql.startswith("--", i):
            j = sql.find("\n", i)
            i = n if j < 0 else j
            out.append(" ")
        elif sql.startswith("/*", i):
            j = sql.find("*/", i + 2)
            i = n if j < 0 else j + 2
            out.append(" ")
        elif c in "'\"`[":
            close = "]" if c == "[" else c
            j = i + 1
            while j < n:
                if sql[j] == close:
                    if j + 1 < n and sql[j + 1] == close and close != "]":  # escaped '' or ""
                        j += 2
                        continue
                    break
                j += 1
            i = j + 1
            out.append(" ? ")
        else:
            out.append(c)
            i += 1
    return "".join(out)


def check(sql: str) -> str:
    """Return the cleaned statement (without trailing ';') or raise SqlRejected."""
    stripped = _strip(sql).strip()
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
    statement = sql.strip()
    while statement.endswith(";"):
        statement = statement[:-1].rstrip()
    return statement
