# Ikonet license console (Plexa DB)

Internal tool for Ikonet: issues, renews and looks up customer licenses.
It runs **only on Ikonet's PC** and listens on 127.0.0.1.

```bash
gateway\.venv\Scripts\python tools\license-console\console.py
```

It opens http://127.0.0.1:8790.

- **Private key and registry**: `%USERPROFILE%\.plexa-licensing\`
  (`ikonet_license_private.pem`, `licenses.sqlite`). They are not in the repository.
  **Back up this folder**: without the private key no new license can be issued,
  and the gateways only trust that key (its public half is in `gateway/plexa_gateway/licensing.py`).
- **Issue**: customer, plan, limits (empty = unlimited), expiry, gateway ID
  (`*` = any gateway). The customer pastes the key in Administration → License.
- **Renew**: issues a new key with the same terms and a new expiry; the old key
  is marked "replaced" in the registry.
- **Revoke**: marks the license in the registry. Licenses are checked offline, so a
  key already handed over keeps working until its expiry: prefer yearly licenses.
