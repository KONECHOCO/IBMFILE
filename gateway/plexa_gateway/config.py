"""Runtime configuration, read from environment variables (see gateway/.env.example)."""
import os
import secrets
from pathlib import Path

GATEWAY_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = Path(os.environ.get("PLEXA_DATA_DIR", GATEWAY_DIR / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "plexa.sqlite"

JT400_JAR = Path(os.environ.get("PLEXA_JT400_JAR", GATEWAY_DIR / "lib" / "jt400.jar"))

# Web client build served by the gateway (the "web version"). Optional.
WEB_DIST = Path(os.environ.get("PLEXA_WEB_DIST", GATEWAY_DIR.parent / "dist"))

CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "PLEXA_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,capacitor://localhost,https://localhost,http://localhost",
    ).split(",")
    if o.strip()
]

MAX_ROWS = int(os.environ.get("PLEXA_MAX_ROWS", "5000"))
QUERY_TIMEOUT_S = int(os.environ.get("PLEXA_QUERY_TIMEOUT", "60"))
TOKEN_HOURS = int(os.environ.get("PLEXA_TOKEN_HOURS", "12"))

# Seeds a local SQLite demo connection with sample data (clearly labelled as demo).
DEMO_MODE = os.environ.get("PLEXA_DEMO", "1") not in ("0", "false", "no")

# Public demo (store reviewers, beta testers): a shared read-only "analyst" account
# whose credentials the sign-in screen shows. Nobody can add connections.
PUBLIC_DEMO = os.environ.get("PLEXA_PUBLIC_DEMO", "0") in ("1", "true", "yes")
DEMO_USER = os.environ.get("PLEXA_DEMO_USER", "demo")
DEMO_PASSWORD = os.environ.get("PLEXA_DEMO_PASSWORD", "plexa-demo")
QUERIES_PER_MINUTE = int(os.environ.get("PLEXA_QUERIES_PER_MINUTE", "30" if PUBLIC_DEMO else "0"))

# Set to 1 only behind a reverse proxy that overwrites X-Real-IP (e.g. nginx).
TRUST_PROXY = os.environ.get("PLEXA_TRUST_PROXY", "0") in ("1", "true", "yes")

BOOTSTRAP_ADMIN_USER = os.environ.get("PLEXA_ADMIN_USER")
BOOTSTRAP_ADMIN_PASSWORD = os.environ.get("PLEXA_ADMIN_PASSWORD")


def _persistent_secret(env_name: str, filename: str, factory) -> str:
    """Use the env var if set, otherwise generate once and keep it in DATA_DIR."""
    value = os.environ.get(env_name)
    if value:
        return value
    path = DATA_DIR / filename
    if path.exists():
        return path.read_text().strip()
    value = factory()
    path.write_text(value)
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass
    return value


def _fernet_key() -> str:
    from cryptography.fernet import Fernet
    return Fernet.generate_key().decode()


JWT_SECRET = _persistent_secret("PLEXA_JWT_SECRET", "jwt.secret", lambda: secrets.token_urlsafe(48))
ENCRYPTION_KEY = _persistent_secret("PLEXA_ENCRYPTION_KEY", "vault.key", _fernet_key)


def _gateway_id() -> str:
    import uuid
    return "GW-" + uuid.uuid4().hex[:12].upper()


# Identifies this installation; licenses can be bound to it.
GATEWAY_ID = _persistent_secret("PLEXA_GATEWAY_ID", "gateway.id", _gateway_id)
