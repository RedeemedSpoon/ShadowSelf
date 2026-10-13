<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./application/frontend/src/lib/images/brands/shadowself/logo-white-text.svg">
    <img alt="ShadowSelf" src="./application/frontend/src/lib/images/brands/shadowself/logo-dark-text.svg" width="60%">
  </picture>
</p>

ShadowSelf keeps synthetic identity profiles, email, phone conversations, encrypted account credentials and cryptocurrency wallets in one workspace. Vault encryption and wallet signing run in the browser. Email, phone, billing and chain queries rely on configured external services.

The public API uses `/api`. The `/docs` page documents authentication, endpoints and error responses.

## Local development

Use Bun 1.4.3 and PostgreSQL. Install dependencies from the repository root and each application directory:

```sh
bun install --frozen-lockfile
cd application/backend
bun install --frozen-lockfile
cd ../frontend
bun install --frozen-lockfile
```

Create local `.env` files in `application/backend`, `application/frontend` and `application/database`. The backend configuration in `application/backend/src/core/config.ts` lists required application secrets and optional provider settings. Never commit credentials. Missing providers report unavailable service states.

Initialize a fresh development database with `application/database/schemas.sql`, then apply `application/database/roles.sql` with `APP_DB_PASSWORD`, `MAIL_DB_PASSWORD` and `POSTGRES_DB` in the environment. The schema replaces the database tables. Use a disposable database; do not run initialization against a database you want to preserve.

Run `bun dev` in `application/backend` for port 3000 and in `application/frontend` for port 5000. The frontend routes browser API requests to the backend on the same origin. `.scripts/tmux-session.sh` starts both in separate panes.

## Verification

From the repository root:

```sh
bun format
bun lint
bun check
bun run build
```

`bun run verify` runs lint, type checks and builds. Inspect affected routes in the T3 integrated browser at desktop and mobile sizes.

CI uses frozen lockfiles and rejects moderate-or-higher dependency advisories with `bun run audit`. Review low-severity findings separately. Commit dependency manifests and their `bun.lock` together. Generated reports, downloaded workers, build output and credentials stay out of source control.

## Browser extension

The companion connects to an explicitly selected signed-in ShadowSelf tab in the current browser window. It lists identities and opens their workspace. It does not read authentication cookies or store account data in persistent extension storage.

Network routing is unavailable. The self-hosted Squid/OpenVPN service and its browser controls have been retired. No replacement network provider is included.

Build production packages with:

```sh
bun run package:extension
```

For local development, run `bash .scripts/pack-extension.sh /tmp/shadowself-extensions --development`. Extract the appropriate archive and load its directory as an unpacked extension. Development packages only request access to `http://localhost:5000`; production packages only request access to `https://shadowself.io`.

## Deployment

`application/compose.yaml` defines the website, backend, database and TLS services. Configure provider callback URLs under `/api/webhooks/stripe` and `/api/webhooks/twilio`. HTTPS and onion listeners route the same `/api` contract, including events.

Set production `APP_ORIGIN` to the public HTTPS origin. Compose clears frontend `ORIGIN` and reads the host and protocol headers supplied by Nginx so HTTPS and onion requests retain their own origins. Use `POSTGRES_HOST=postgres` for Compose and clear development `TRUSTED_PROXY_IPS`; Compose resolves the trusted frontend and Nginx service hosts. Enable cryptocurrency billing only after configuring and validating the Monero wallet.

The operations scripts use explicit targets. Set `SHADOWSELF_SSH_TARGET` and `SHADOWSELF_DB_CONTAINER` for `.scripts/backup-database.sh` and `.scripts/query-database.sh`. `.scripts/maintenance.sh` updates host packages and reasserts Compose services; schedule it through your host scheduler. `.scripts/check-crowdsec.sh` checks the host services, collections, acquisition metrics and decisions.

## Contributing

Follow [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md). The application has no production users or data to migrate. Change the fresh schema and update every consumer when a contract changes. Do not retain compatibility routes or old-format fallbacks.

Licensed under [AGPL-3.0](COPYING).
