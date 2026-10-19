# Contributing to ShadowSelf

[AGENTS.md](AGENTS.md) defines code style, security, UI and validation requirements. Read it before editing. The `/docs` page documents the public API.

## Work in complete changes

Inspect the existing behavior and its consumers before choosing an implementation. When a contract changes, update backend, frontend, extension, documentation and deployment routing together. Keep ownership clear when agents work in parallel; do not overwrite unrelated edits.

The rewrite may replace libraries and their required packages. New dependencies outside that scope need approval. Remove replaced implementations and unused packages. Commit lockfiles with manifest changes so CI and deployment install the same dependencies.

Update the fresh database schema directly. Do not introduce migrations or compatibility paths for development data. Keep transient and derivable state out of persistent records.

## Review

Run `bun format`, `bun lint`, `bun check` and `bun run test`. Run `bun run build` for broad or critical changes. Use the T3 integrated browser for every affected frontend route at desktop and mobile sizes, exercising the changed behavior and recovery paths.

Report validation limits accurately. Local checks do not prove a live provider integration works. Screenshots do not establish that keyboard interaction or failure recovery works.

Keep generated reports, test artifacts, credentials and build output out of commits. Describe a change with the concrete behavior it fixes, the final implementation and relevant validation. Do not commit or push when the active task prohibits it.

## Issues

Include reproduction steps, expected and observed behavior, runtime versions and a sanitized error message. Remove tokens, credentials, personal data and provider payloads containing private information before sharing logs.

Feature proposals should explain the user task and why the existing workflow cannot satisfy it. Keep changes focused on the requested task and its affected screens, tables, and integrations.

## Regression tests

For local testing, an empty `SECRET_SAUCE` uses the fixed `DEVELOPMENT_SECRET_SAUCE` in backend constants. No key file is created. An explicit environment key takes precedence. This fallback applies to `NODE_ENV=dev`, `development`, or `test`, and when `NODE_ENV` is unset. Production still requires a configured random secret of at least 32 characters. Switching keys makes existing server-encrypted secrets and recovery hashes unusable.

`POSTGRES_DB` and `APP_DB_PASSWORD` remain required. Provider keys can stay empty, but the corresponding email, phone, AI, and billing operations remain unavailable until configured.

`bun run test` runs each test file in its own process so mocked provider adapters cannot leak between suites. The provider boundary suite uses synthetic secrets and does not connect to a database.

Database integration tests require `SHADOWSELF_TEST_DATABASE_URL` pointing to a disposable local database whose name ends in `_test`. The suites reset its fresh schema and fixtures. CI supplies an isolated PostgreSQL service; never point this variable at an application database.

With the frontend dev server running, use the T3 browser to run component state regressions at desktop and mobile sizes:

```js
await (await import('/tests/console-states.browser.ts')).runConsoleStateRegressions();
```

These mount real components with synthetic responses and restore browser state after each run. Exercise live provider integrations separately when test credentials are configured.
