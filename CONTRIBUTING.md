# Contributing to ShadowSelf

[AGENTS.md](AGENTS.md) defines code style, security, UI and validation requirements. Read it before editing. The `/docs` page documents the public API.

## Work in complete changes

Inspect the existing behavior and its consumers before choosing an implementation. When a contract changes, update backend, frontend, extension, documentation and deployment routing together. Keep ownership clear when agents work in parallel; do not overwrite unrelated edits.

The rewrite may replace libraries and their required packages. New dependencies outside that scope need approval. Remove replaced implementations and unused packages. Commit lockfiles with manifest changes so CI and deployment install the same dependencies.

Update the fresh database schema directly. Do not introduce migrations or compatibility paths for development data. Keep transient and derivable state out of persistent records.

## Review

Run `bun format`, `bun lint` and `bun check`. Run `bun run build` for broad or critical changes. Use the T3 integrated browser for every affected frontend route at desktop and mobile sizes, exercising the changed behavior and recovery paths.

Report validation limits accurately. Local checks do not prove a live provider integration works. Screenshots do not establish that keyboard interaction or failure recovery works.

Keep generated reports, test artifacts, credentials and build output out of commits. Describe a change with the concrete behavior it fixes, the final implementation and relevant validation. Do not commit or push when the active task prohibits it.

## Issues

Include reproduction steps, expected and observed behavior, runtime versions and a sanitized error message. Remove tokens, credentials, personal data and provider payloads containing private information before sharing logs.

Feature proposals should explain the user task and why the existing workflow cannot satisfy it. Roadmap entries are not authorization to add speculative screens, tables or integrations during unrelated work.
