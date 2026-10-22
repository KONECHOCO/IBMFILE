"""Support commands, run on the gateway machine:

    python -m plexa_gateway.cli list-users
    python -m plexa_gateway.cli reset-password USERNAME     (asks for the new password)
    python -m plexa_gateway.cli create-admin USERNAME
    python -m plexa_gateway.cli info

Useful when nobody can sign in any more (forgotten admin password).
"""
import getpass
import json
import sys

from . import config, licensing, store
from .security import hash_password


def _ask_password() -> str:
    while True:
        pw = getpass.getpass("New password (min 8 characters): ")
        if len(pw) < 8:
            print("Too short.")
            continue
        if getpass.getpass("Repeat: ") != pw:
            print("The two passwords differ.")
            continue
        return pw


def main(argv) -> int:
    store.init()
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    cmd, args = argv[0], argv[1:]
    if cmd == "list-users":
        for u in store.list_users():
            print(f"{u['username']:<24} {u['role']:<8} {u['created_at']}")
    elif cmd == "reset-password" and args:
        user = store.get_user_by_name(args[0])
        if not user:
            print(f"User '{args[0]}' not found.")
            return 1
        store.set_password(user["id"], hash_password(_ask_password()))
        store.audit(username="cli", role="admin", action="user.password", statement=args[0], status="OK", client_ip="console")
        print("Password changed.")
    elif cmd == "create-admin" and args:
        if store.get_user_by_name(args[0]):
            print(f"User '{args[0]}' already exists: use reset-password.")
            return 1
        store.create_user(args[0], hash_password(_ask_password()), "admin")
        store.audit(username="cli", role="admin", action="user.create", statement=f"{args[0]} (admin)", status="OK", client_ip="console")
        print("Administrator created.")
    elif cmd == "info":
        print(json.dumps({"gatewayId": config.GATEWAY_ID, "dataDir": str(config.DATA_DIR),
                          "users": store.count_users(), "connections": store.count_connections(),
                          "license": licensing.status()}, indent=2))
    else:
        print(__doc__)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
