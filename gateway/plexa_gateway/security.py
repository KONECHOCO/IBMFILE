"""Password hashing, credential encryption and JWT tokens."""
import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from cryptography.fernet import Fernet, InvalidToken

from . import config

_fernet = Fernet(config.ENCRYPTION_KEY.encode())

# ── Credentials vault (AES-128-CBC + HMAC-SHA256 via Fernet) ────────────────


def encrypt(plain: str) -> str:
    return _fernet.encrypt((plain or "").encode()).decode()


def decrypt(token: str) -> str:
    if not token:
        return ""
    try:
        return _fernet.decrypt(token.encode()).decode()
    except InvalidToken as e:
        raise RuntimeError("Cannot decrypt the stored password: was the vault key changed?") from e


# ── User passwords (scrypt, stdlib) ─────────────────────────────────────────

_SCRYPT = dict(n=2**14, r=8, p=1, dklen=32)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, **_SCRYPT)
    return "scrypt$" + base64.b64encode(salt).decode() + "$" + base64.b64encode(digest).decode()


def verify_password(password: str, stored: str) -> bool:
    try:
        _, salt_b64, digest_b64 = stored.split("$")
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(digest_b64)
    except ValueError:
        return False
    digest = hashlib.scrypt(password.encode(), salt=salt, **_SCRYPT)
    return hmac.compare_digest(digest, expected)


# ── JWT ─────────────────────────────────────────────────────────────────────


def make_token(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "usr": user["username"],
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=config.TOKEN_HOURS),
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")


def read_token(token: str) -> dict:
    return jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
