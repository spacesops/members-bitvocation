# Deploying members-bitvocation on Ubuntu 24.04 LTS

This repository is the **static members site** (HTML, CSS, JS): NIP-07 sign-in, gated job board, **members-only** and **founders-only** pages. It does **not** run its own server; production uses **custom nginx** from the sibling **nginx** repository with **fabric-lookupd** and the certrelay **`fabric`** CLI.

Tested target: **Ubuntu 24.04.x LTS**, **x86_64**.

Full stack instructions (build nginx, lookupd, systemd, TLS): sibling checkout **`../nginx/docs/deployment/ubuntu-24.04.md`** (same path in the nginx repo: `docs/deployment/ubuntu-24.04.md`).

---

## What this repo contains

| Path | Role |
|------|------|
| `index.html` | Public gate + member app shell |
| `js/gate.js` | NIP-07 sign-in → `POST /auth/session` |
| `js/site.js` | Gated member UI (loaded after verify) |
| `members-only.html` | Tiered page (`@bitvocation` / `@bitcoin` via nginx) |
| `founders-only.html` | Founders npub allowlist (server env) |
| `js/nostr-bridge.js`, `js/nip19.js` | Local helpers (no remote script CDNs) |

Server-side behavior (cookies, Fabric verify, `auth_request`) is entirely in **nginx + fabric-lookupd**, not in this repo.

---

## Production layout

On the server, this checkout should match the **`root`** directive in nginx `conf/members-bitvocation.conf`:

```text
/opt/bitvocation/members-bitvocation/   ← clone this repo here
```

Example nginx snippet (in the **nginx** repo):

```nginx
root   /opt/bitvocation/members-bitvocation;
```

---

## Clone only this site

If the stack is already running and you only update content:

```bash
cd /opt/bitvocation
git clone <YOUR_MEMBERS_REMOTE> members-bitvocation
# or: cd members-bitvocation && git pull
```

No `cargo` or nginx build is required **for static-only** changes. Reload is usually unnecessary (nginx serves files as-is). Bump cache-busting query strings in `index.html` when you change `gate.js` / `site.js` (e.g. `?v=9`).

---

## First-time full stack (summary)

You need **three** repos as siblings (see nginx deployment doc):

1. **members-bitvocation** (this repo) — static files  
2. **nginx** — `objs/nginx`, `conf/`, `scripts/`, `fabric-lookupd`  
3. **certrelay** — `target/release/fabric` for verified resolve  

On Ubuntu 24.04:

```bash
sudo apt install -y build-essential git curl pkg-config libssl-dev zlib1g-dev libpcre2-dev
# rustup, clone three repos under /opt/bitvocation/
# edit nginx conf/members-bitvocation.conf → root = /opt/bitvocation/members-bitvocation
# build nginx, fabric, fabric-lookupd; create members-stack.env; systemd
```

Follow the **nginx** doc for commands, env vars, systemd, UFW, and Certbot.

---

## Environment variables that affect this site

Configured in the **nginx** repo (`members-stack.env`), not here:

| Variable | Effect on UX |
|----------|----------------|
| `SESSION_SECRET` | Session cookie signing (required in production) |
| `FOUNDERS_NPUBS` | Who can open `founders-only.html` |
| `MEMBER_SPACE_SUFFIXES` | Who can open `members-only.html` (default `bitvocation,bitcoin`) |
| `FABRIC_*` | How long “Verifying @space…” may take on first sign-in |

Sign-in timeout in the UI: `js/gate.js` (`SESSION_TIMEOUT_MS` ≈ 120s), aligned with `FABRIC_SEARCH_TIMEOUT` and nginx `/auth/` proxy timeouts.

---

## URL tiers (what visitors see)

| URL | Requirement |
|-----|----------------|
| `/` | Public; sign-in via NIP-07 |
| `/js/site.js`, gated assets | Verified `@space` session |
| `/members-only.html` | Verified handle in `MEMBER_SPACE_SUFFIXES` |
| `/founders-only.html` | Verified `@space` + npub in `FOUNDERS_NPUBS` |

403 pages are defined in nginx `conf/fabric-gateway.conf`.

---

## HTTPS and domain

Browsers need **HTTPS** for NIP-07 extensions on a real hostname (not only `localhost`). Typical pattern on Ubuntu 24.04:

- This stack listens on **127.0.0.1:8088**
- Distro **nginx + certbot** on **443** proxies to 8088  

Details: nginx repo `docs/deployment/ubuntu-24.04.md` § HTTPS.

---

## Deploy updates (content)

```bash
cd /opt/bitvocation/members-bitvocation
git pull
```

If you changed only HTML/CSS/JS, no stack restart is required. After JS changes, ensure `index.html` (and any HTML that imports scripts) uses an updated `?v=` query param so clients fetch fresh modules.

---

## Local development

Without a remote server, run the stack from the **nginx** repo on your workstation:

```bash
cd /path/to/nginx
./scripts/run-members-stack.sh
```

Point `conf/members-bitvocation.conf` `root` at your local clone of this repo.

---

## Checklist (this repo)

- [ ] Cloned to `/opt/bitvocation/members-bitvocation` (or path matching nginx `root`)
- [ ] nginx deployment doc completed (lookupd, secrets, systemd)
- [ ] Real `server_name` + TLS for production NIP-07
- [ ] `FOUNDERS_NPUBS` / `MEMBER_SPACE_SUFFIXES` set if using tiered pages
