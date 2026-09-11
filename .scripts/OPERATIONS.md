# Fresh deployment and recovery

This applies to a fresh ShadowSelf environment. Do not run these steps against the retired V1 host. The initialization SQL replaces the development schema; it is not a migration. There are no backfills or old API contracts.

## Application and database

Use Bun 1.4.2 and PostgreSQL 18.4. The database volume mounts `/var/lib/postgresql`. Supply `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `APP_DB_PASSWORD`, and `MAIL_DB_PASSWORD` in `application/database/.env`. Use independent random passwords. The backend connects as `shadowself_app`; mail services use the restricted `shadowself_mail` role. Only the database container uses the bootstrap administrator.

Supply the variables required by `application/backend/src/core/config.ts` in the backend environment and the public Stripe key/environment in the frontend environment. Set `APP_ORIGIN` to the actual HTTPS application origin. Pending login and email-verification challenges are bounded process memory; deploy one backend replica. Restarts invalidate pending challenges. Creation grants, payment records, and deletion jobs are stored in PostgreSQL.

From `application`, run `docker compose --env-file frontend/.env up -d --build --wait`. Check `/health/live` inside the backend container. `/health/billing` returns 503 until wallet synchronization and pricing are available. Wallet failures do not stop the account API or Stripe repair worker. Validate the public homepage and authenticated application separately.

`.scripts/deploy-change.sh` defaults to a dry run. It requires local and remote rsync plus remote Docker Compose. Set `SHADOWSELF_SSH_TARGET`, `SHADOWSELF_REMOTE_PATH`, and optionally `SHADOWSELF_COMPONENT` and `SSH_KEY`. Apply with `--apply`. The script preserves environment files, saves source and images before transfer, and restores them on transfer, configuration, build, or health-check failure. Failed source is retained in a private directory for inspection. It does not roll database schemas backward; schema replacement belongs to a deliberate fresh deployment.

## Backup and restore

Set `SHADOWSELF_SSH_TARGET` and `SHADOWSELF_DB_CONTAINER`, optionally `SSH_KEY`, then run `.scripts/backup-database.sh /secure/path/database.dump`. The custom-format dump is mode 0600, validated with `pg_restore --list`, and never overwrites an existing file. Back up deployment secrets, TLS material, and `/var/vmail` separately with restricted access and encrypted off-host storage.

Verify restoration in a disposable PostgreSQL 18 database. Create an empty database, run `pg_restore --exit-on-error --no-owner --no-privileges --dbname=<disposable-database> database.dump`, compare table counts and representative records, and exercise account authentication and invoice ownership there. Do not interpret an archive listing as a restore test. Roles and their passwords are provisioned separately from an ordinary database dump.

## Virtual mail

The supplied configuration targets Debian 12's Postfix and Dovecot 2.3 packages with security updates, PostgreSQL drivers, and systemd. It replaces a fresh mail configuration. It is not a Dovecot 2.4 compatibility layer. Install the mail packages as an explicit host provisioning step before applying configuration.

Provide a valid certificate for `mail.shadowself.io`, correct A/AAAA, MX and reverse DNS, SPF, and DMARC. Configure DKIM signing through the host's mail administration before sending public mail. Incoming SMTP uses port 25; authenticated submission uses 465 or STARTTLS on 587; IMAP requires TLS on 993. Submission rejects impersonation of another mailbox. Outbound SMTP requires TLS, so delivery to servers without TLS fails rather than sending plaintext.

Set `POSTGRES_DB`, `MAIL_DB_PASSWORD` as 48 to 128 hexadecimal characters, `SHADOWSELF_TLS_CERT`, and `SHADOWSELF_TLS_KEY`. Run `.scripts/configure-mail.sh --dry-run`, then `--apply` on the fresh host. UID/GID 5000 must be available for `vmail`. The script renders credentials privately, saves the prior configuration, validates Postfix/Dovecot syntax and service state, and restores configuration if validation fails.

The `mailboxes` view exposes active identity mailboxes and explicit service mailboxes. Insert `contact@shadowself.io` and `verification@shadowself.io` into `service_mailboxes` using base64-encoded SHA-256 hashes of the corresponding random `EMAIL_CONTACT` and `EMAIL_VERIFICATION` passwords. Keep those plaintext passwords only in the restricted backend environment. Application identity passwords are generated randomly and hashed by the mail view. The mail database role can read only the view.

Install `.scripts/mail-cleanup.sh` as a root-owned executable and schedule it with systemd using a restricted environment file containing `SHADOWSELF_DB_CONTAINER`. Run once per minute. It deletes only validated mailbox paths for durable deletion jobs. The backend retains identity ownership until mail cleanup, provider cleanup and eligible card refunds finish. Monitor incomplete jobs with `SELECT identity_id, created_at FROM identity_deletions WHERE completed_at IS NULL`.

Before release, use disposable mailboxes to test external inbound delivery, authenticated outbound submission, IMAP login, Sent/Drafts/Junk behavior, CID and PGP attachments, refused cross-mailbox sender impersonation, and cleanup followed by failed authentication. Restore `/var/vmail` together with its database snapshot and repeat delivery. Configuration rendering and MIME fixtures do not establish live mail delivery.

## Billing recovery

Configure Stripe's snapshot webhook destination for API version `2026-08-26.dahlia`, matching the installed SDK, and `/webhook-stripe`. Enable `payment_intent.succeeded`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`, `charge.dispute.created`, and `customer.subscription.deleted`. Verify signatures using the unmodified raw body and the destination's own signing secret. Receipt is persisted before acknowledgement; processing and retries are separate.

From the backend directory, with its application and database environment supplied, run `bun src/reconcile-billing.ts <ISO-start-date>` to recover provider objects and missed Stripe events from the last 30 days. This performs local reconciliation and retries pending identity cleanup, including eligible refunds. Inspect its unresolved-request output. It must use the intended environment's credentials; never point validation fixtures at live providers.

A checkout request ID is immutable. Reuse it for retries. Unknown requests older than 23 hours stop automatically to avoid reusing a pruned Stripe idempotency key. The repair command matches provider metadata to the persisted identity ID and refuses ambiguous matches. A missing match is not permission to charge again.

Crypto invoices retain quotes, subaddresses, provider references, observations and expired payments. The full required amount must first be observed before expiry to activate automatically; confirmations may finish later. Underpayments remain recorded, and late full payments require reconciliation. Cached subaddresses are persisted before their address is returned and reused by invoice label after a retry.

A swap request interrupted before its provider reference is saved stays blocked. Use the invoice's reserved Monero address and provider records to identify the trade, verify its destination and amount, and reconcile it before allowing another request. Never reset `provider_state` merely to make a retry succeed. Cryptocurrency refunds follow the existing manual XMR refund policy; this server has a view-only billing wallet and cannot sign payouts. Retained invoices and payment observations support that review.

Stripe documents its [idempotency retention and retries](https://docs.stripe.com/api/idempotent_requests), [webhook delivery](https://docs.stripe.com/webhooks), and [event recovery](https://docs.stripe.com/api/events/list).

## CrowdSec

Install and configure CrowdSec and its firewall bouncer on the new host. Enable `crowdsecurity/linux`, `crowdsecurity/nginx`, `crowdsecurity/postfix`, and `crowdsecurity/dovecot`. Install `application/crowdsec/acquis.yaml` under `/etc/crowdsec/acquis.d/` and `nginx-logrotate` under `/etc/logrotate.d/`. Nginx logs are mounted at `/var/log/shadowself/nginx` for acquisition. Confirm that the host's Postfix and Dovecot journal entries match the configured unit filters; distributions using rsyslog need their actual mail log paths represented explicitly.

Run `.scripts/check-crowdsec.sh`. Generate normal HTTP and failed disposable mailbox-login traffic, then verify acquisition/parser counters increase. From an isolated external probe, add a short test decision for that probe's IP, verify packets are blocked by the bouncer, delete the decision, and verify access returns. Never ban the administration connection. Check the Docker forwarding path as well as host INPUT rules; an active bouncer process alone does not establish protection of published container ports.

## Release validation

Use isolated provider credentials and disposable accounts. Verify desktop/mobile identity, settings, purchase, email, wallet and documentation routes; Chrome and Firefox cookies/private contexts; extension tab binding; CSP workers and QR-camera permission; WebSocket revocation; duplicate/out-of-order webhooks; failed provider cleanup; and backup restoration. Keep test files temporary and remove their artifacts after validation. Do not publish the rebuilt application until the external delivery, payment and packet-enforcement checks are recorded for the new environment.

## Proxy accounts

The proxy API requires `SECRET_KEY`. A named `proxy-auth` volume holds bcrypt password hashes and is mounted read-only in Squid. The API serializes changes and replaces the password file atomically. Run one API instance per volume. Include this volume in backups. Fresh deployments start with an empty account file; provisioning writes accounts as identities are created. Verify Squid authentication with the built image before release because bcrypt support depends on its crypt library.
