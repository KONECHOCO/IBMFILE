"""Offline-verifiable licenses.

A license key is  PLEXA1.<payload>.<signature>  (base64url, no padding), where
the payload is JSON signed with Ikonet's Ed25519 private key. Keys are issued
with tools/license-console on Ikonet's PC; the gateway only holds the public key,
so it can check a key without internet access but cannot create one.

Without a valid license the gateway runs as "Community" with small limits.
Existing users and connections keep working when a license expires: only
creating new ones above the Community limits is refused.
"""
import base64
import json
from datetime import date

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from . import config, store

PUBLIC_KEY = "2W6Mkw5t/SqXSOapOJveqGjAjwJO61dzsLdN0ndHYSw="
PREFIX = "PLEXA1"

COMMUNITY = {"plan": "community", "maxUsers": 3, "maxConnections": 2}


class LicenseError(ValueError):
    pass


def _b64d(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def decode(key: str) -> dict:
    """Return the verified payload or raise LicenseError (signature only, not expiry/binding)."""
    try:
        prefix, payload_b64, sig_b64 = key.strip().split(".")
    except ValueError:
        raise LicenseError("Malformed license key.")
    if prefix != PREFIX:
        raise LicenseError("Unknown license key format.")
    try:
        payload_bytes = _b64d(payload_b64)
        Ed25519PublicKey.from_public_bytes(base64.b64decode(PUBLIC_KEY)).verify(_b64d(sig_b64), payload_bytes)
        return json.loads(payload_bytes)
    except (InvalidSignature, ValueError):
        raise LicenseError("Invalid license key: signature check failed.")


def check(payload: dict) -> None:
    gid = payload.get("gatewayId") or "*"
    if gid != "*" and gid != config.GATEWAY_ID:
        raise LicenseError(f"This license belongs to another gateway ({gid}). This gateway is {config.GATEWAY_ID}.")
    if payload.get("expires") and date.fromisoformat(payload["expires"]) < date.today():
        raise LicenseError(f"License expired on {payload['expires']}.")


def activate(key: str) -> dict:
    payload = decode(key)
    check(payload)
    store.set_setting("license_key", key.strip())
    return status()


def remove() -> None:
    store.set_setting("license_key", None)


def status() -> dict:
    """Current license, limits included. Never raises."""
    key = store.get_setting("license_key")
    base = {**COMMUNITY, "valid": False, "customer": None, "email": None, "expires": None,
            "licenseId": None, "gatewayId": config.GATEWAY_ID, "problem": None}
    if not key:
        return base
    try:
        payload = decode(key)
        check(payload)
    except LicenseError as e:
        return {**base, "problem": str(e)}
    return {
        **base,
        "valid": True,
        "plan": payload.get("plan", "business"),
        "maxUsers": payload.get("maxUsers"),          # None = unlimited
        "maxConnections": payload.get("maxConnections"),
        "customer": payload.get("customer"),
        "email": payload.get("email"),
        "expires": payload.get("expires"),
        "licenseId": payload.get("lid"),
    }


def ensure_can_add(kind: str, current: int) -> None:
    """kind: 'users' | 'connections'. Raises LicenseError if the limit is reached."""
    if config.PUBLIC_DEMO:
        return
    st = status()
    limit = st["maxUsers"] if kind == "users" else st["maxConnections"]
    if limit is not None and current >= limit:
        raise LicenseError(
            f"Limit reached for the {st['plan']} plan: {limit} {kind}. "
            "Activate a license in Administration → License to add more."
        )
