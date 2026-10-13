# ShadowSelf audit, 13 October 2026

The most urgent work is transaction and message correctness. Another visual rewrite would leave the main failures intact. I found reproducible bugs in wallet rendering, address discovery, email forwarding, mailbox pagination, and dashboard sorting. The strongest performance opportunities are wallet provider requests, the identity route's JavaScript, full-message mailbox loading, and invoice processing.

This is a findings report. Application fixes have not been applied. P1 means fix before trusting the affected workflow with real messages or funds. P2 means a consequential correctness, recovery, or performance issue. P3 means product friction or cleanup. Reproduced findings use the existing implementation with synthetic inputs; reviewed findings describe a specific code path whose live integration was not exercised.

## Fix first

### 1. P1: forwarding can send the wrong email

**Reproduced with a mocked IMAP connection.** The client sends only a UID. UIDs belong to a mailbox, but `fetchEmail` searches both INBOX and Sent and overwrites an earlier match. With UID 7 in both mailboxes, asking to forward the Inbox message returns the Sent message instead. That can disclose a different conversation to the chosen recipient.

Pass the mailbox with the UID, validate both, and fetch exactly that message. Use a separate Message-ID lookup for reply threading. Update the API documentation and client together.

Sources: [forward endpoint](/home/mesh/Code/ShadowSelf/application/backend/src/routes/public-api/api-email.ts:90), [lookup](/home/mesh/Code/ShadowSelf/application/backend/src/utils/email-imap.ts:156), [client](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/Mail.svelte:153).

### 2. P1: a transaction involving two wallet addresses crashes wallet history

**Reproduced in the provider code and T3 browser.** Address histories are concatenated without aggregation. One transaction paying two addresses belonging to the same wallet produces two rows with the same txid. Wallet history keys rows by txid, and the real component throws `each_key_duplicate`. The fixture produced two rows, one unique txid, and two separate 0.001 BTC amounts.

Aggregate each transaction across all owned inputs and outputs before classifying its direction and amount. Merely removing one duplicate would leave incorrect accounting for internal transfers and change.

Sources: [address history](/home/mesh/Code/ShadowSelf/application/backend/src/utils/crypto-nodes.ts:95), [wallet history rendering](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/Wallet.svelte:259).

### 3. P1: address discovery can report zero funds or generate an address it cannot discover

**Reproduced.** Discovery stops after five unused addresses and never scans beyond index 119. A funded index 5 after five unused addresses is never queried and returns a zero balance. More directly relevant to this app, when all 120 scanned addresses have activity, the response supplies `nextIndex: 120`. Receive and change-address generation then use that index, while future scans still stop at 119.

Make discovery and address generation obey the same bounds. A hard limit must produce an explicit incomplete result, never a successful full balance. Support a deliberate recovery scan for existing wallets with larger gaps.

Sources: [discovery](/home/mesh/Code/ShadowSelf/application/backend/src/utils/crypto-nodes.ts:6), [limits](/home/mesh/Code/ShadowSelf/application/backend/src/core/constants.ts:18), [receive address](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/WalletReceive.svelte:25), [change address](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/utils/wallet.ts:164).

### 4. P1: consecutive ETH/USDT sends can reuse a nonce

**Reviewed; the provider-query probe confirms `tag=latest`.** The overview caches the confirmed nonce for 60 seconds, and broadcasting does not invalidate that cache. ETH and USDT share the same sender nonce. A second send before the first mines can therefore sign with the same nonce, replace the earlier transaction, or fail with a replacement error. Refresh can return the cached state immediately after sending.

Fetch the pending nonce and current spendable state when preparing a transaction. Coordinate outstanding sends for the same EVM address, including across tabs, and invalidate affected overview data after broadcast. This needs a deterministic pending-transaction provider test. The [Ethereum execution API](https://ethereum.github.io/execution-apis/next/api/methods/eth_getTransactionCount/) distinguishes the latest canonical block from pending state.

Sources: [nonce query](/home/mesh/Code/ShadowSelf/application/backend/src/utils/crypto-nodes.ts:151), [overview cache](/home/mesh/Code/ShadowSelf/application/backend/src/routes/public-api/api-crypto.ts:45), [signing](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/utils/wallet.ts:260), [post-broadcast refresh](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/WalletTransfer.svelte:251).

### 5. P1: payment invoices omit a provider-required deposit memo

**Reviewed.** Non-XMR invoice creation returns `depositMemo`, but `CryptoInvoice` does not declare it and the purchase page displays only amount and address. If the selected provider trade requires a memo or destination tag, copying those displayed details is insufficient to credit the deposit. The ordinary wallet swap UI already handles this field.

Show a required memo prominently with its own copy control and include it in supported payment URIs. Keep the purchase contract aligned with the backend response. Verify with a synthetic memo-bearing invoice before enabling such payment coins.

Sources: [invoice response](/home/mesh/Code/ShadowSelf/application/backend/src/routes/billing-crypto.ts:216), [purchase invoice](/home/mesh/Code/ShadowSelf/application/frontend/src/routes/purchase/+page.svelte:290), [invoice type](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/types.ts:318).

### 6. P1: one orphaned invoice can interrupt payment processing for everyone

**Reviewed; no database mutation was used to reproduce it.** Account deletion sets invoice owners to NULL. Invoice polling still selects those records. If one reaches paid, activation inserts an identity with that NULL owner, contrary to the identities schema. The error exits the whole polling pass. There is no per-invoice failure boundary, so the same record can keep interrupting later invoices on retries.

Handle ownerless payments explicitly, retain their financial records for reconciliation, and isolate processing failures per invoice. Add an isolated-database test with an ownerless paid invoice followed by a valid paid invoice.

Sources: [polling and activation](/home/mesh/Code/ShadowSelf/application/backend/src/core/background-workers.ts:24), [invoice ownership](/home/mesh/Code/ShadowSelf/application/database/schemas.sql:56), [identity ownership](/home/mesh/Code/ShadowSelf/application/database/schemas.sql:74), [worker retry](/home/mesh/Code/ShadowSelf/application/backend/src/core/background-workers.ts:208).

## Correctness and recovery

### 7. P2: verification links in HTML email are blocked

**Browser DOM inspected; popup outcome follows the sandbox configuration.** Sanitization forces links to `target="_blank"`, while the message iframe has an empty sandbox attribute. That sandbox does not permit popups. The link is visible but cannot open the verification destination through the intended interaction. [MDN documents the required popup permission](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox).

Keep script, form, and remote-content restrictions. Either open validated links through a parent-controlled action or allow only the narrowly required popup capabilities. Test actual activation, not just the sanitized HTML.

Sources: [link sanitization](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/utils/shared.ts:73), [message iframe](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/Mail.svelte:267).

### 8. P2: delayed mailbox responses update the wrong current mailbox

**Reproduced in T3 with the real Mail component.** Start loading older Inbox messages, switch to Sent, then complete the pending response. The Inbox result is appended to Sent because `loadMore` reads the current `mailbox` and `messages` after awaiting. The browser displayed `OLDER INBOX MESSAGE` beneath the Sent row.

Capture the mailbox and cursor before requesting, merge into that mailbox only, and prevent stale results from changing current pagination state. Apply the same request-generation discipline to thread loading and phone conversation selection, which also allow selection changes during requests.

Sources: [mail pagination](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/Mail.svelte:54), [thread loading](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/Mail.svelte:72), [phone selection](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/Phone.svelte:44).

### 9. P2: generated profile changes disappear on reload

**Reviewed.** Name, bio, and picture generation endpoints return new values without persisting them. The client applies them to local state and presents the profile as updated. Normal profile Save does not send the picture, so a newly generated portrait has no persistence path through this UI. Names and bios persist only if the user subsequently enters editing and saves.

Choose a clear contract: generation either saves immediately, or produces an explicitly unsaved preview with Save and Discard controls. Ensure the portrait can be saved too.

Sources: [generation endpoints](/home/mesh/Code/ShadowSelf/application/backend/src/routes/public-api/api-information.ts:33), [client generation](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/Profile.svelte:34), [save payload](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/Profile.svelte:24).

### 10. P2: dashboard sorting is reversed

**Reproduced in T3.** The backend returns newest first. The client's default Newest first option reverses that array, while Oldest first leaves it unchanged. The fixture displayed Old identity before New identity under Newest first, and the opposite under Oldest first.

Sort explicitly by creation time, or preserve the documented backend order and reverse only for oldest first. The current list response does not include creation time, so that choice needs a matching contract change if sorting moves fully to the client.

Sources: [backend ordering](/home/mesh/Code/ShadowSelf/application/backend/src/routes/public-api/index.ts:18), [client sort](/home/mesh/Code/ShadowSelf/application/frontend/src/routes/dashboard/+page.svelte:21).

### 11. P2: validation accepts values that storage or later consumers reject

**Partly reproduced.** Wallet validation accepts 111 repeated `a` characters as an extended public key, even though derivation cannot decode it. Website validation accepts a valid URL longer than 48 characters, while `accounts.website` is `varchar(48)`. Signup allows 32 username characters, while the backend and database allow 25. These become broken wallet reads, database errors, or avoidable rejected forms.

Decode and validate extended keys using the installed key library, including the expected network and account depth. Align website and username bounds across forms, API validation, docs, and the fresh schema. Also validate `draft` explicitly before passing it to IMAP deletion; it currently bypasses the listed field checks.

Sources: [wallet validation](/home/mesh/Code/ShadowSelf/application/backend/src/utils/checks.ts:212), [website validation](/home/mesh/Code/ShadowSelf/application/backend/src/utils/checks.ts:376), [schema](/home/mesh/Code/ShadowSelf/application/database/schemas.sql:103), [signup field](/home/mesh/Code/ShadowSelf/application/frontend/src/routes/signup/+page.svelte:116), [draft deletion](/home/mesh/Code/ShadowSelf/application/backend/src/routes/public-api/api-email.ts:74).

### 12. P2: pending account deletion is treated as completed deletion

**Reviewed across both ends.** The backend returns HTTP 202 with `status: 'deleting'` and asks the user to retry after cleanup. The settings action treats every successful response as completion, deletes the session cookie, and redirects to the homepage. The account remains in the database, and the background worker finishes identity deletion without finishing account deletion.

Preserve and display the pending state. Either keep a clear retry action available or implement durable completion of the account deletion request. Only show completion and clear the session as completed deletion when that state is true.

Sources: [backend pending response](/home/mesh/Code/ShadowSelf/application/backend/src/routes/user-settings.ts:298), [frontend deletion action](/home/mesh/Code/ShadowSelf/application/frontend/src/routes/settings/+page.server.ts:182), [background cleanup](/home/mesh/Code/ShadowSelf/application/backend/src/core/identity-service.ts:240).

### 13. P2: one unavailable wallet dependency blocks every coin and receive action

**Reviewed.** The overview uses one `Promise.all` for BTC, LTC, ETH, and USDT and requires globally fresh prices and fees. A Litecoin outage or stale fee provider prevents opening Bitcoin receiving tools and even accessing the separately synced Monero UI. Price polling validates that XMR exists but does not guarantee all coin entries, changes, and charts that the client dereferences.

Return explicit per-coin availability and validate market entries independently. Render receive actions from known public keys without requiring unrelated balances, prices, or fees. Preserve failures as failures rather than manufacturing zero balances.

Sources: [overview](/home/mesh/Code/ShadowSelf/application/backend/src/routes/public-api/api-crypto.ts:18), [price ingestion](/home/mesh/Code/ShadowSelf/application/backend/src/core/background-workers.ts:154), [client dereferences](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/Wallet.svelte:35).

### 14. P2: uncertain swaps have a safety stop but no complete recovery workflow

**Reviewed.** Wallet swaps are marked requested before calling the provider. A failed or interrupted call leaves that request permanently requested, and retries return an uncertainty error. Crypto invoice provider requests have the same issue. The reconciliation command reports unresolved crypto invoices but does not recover them, and it does not reconcile wallet swaps. The swap UI loses its request ID when unmounted and can create a new one on another quote.

Retain a recoverable operation reference, expose its status, and implement provider reconciliation before permitting another purchase or trade. Keep the current protection against blindly repeating an uncertain external action.

Sources: [swap state](/home/mesh/Code/ShadowSelf/application/backend/src/routes/public-api/api-crypto.ts:68), [invoice state](/home/mesh/Code/ShadowSelf/application/backend/src/routes/billing-crypto.ts:179), [reconciliation](/home/mesh/Code/ShadowSelf/application/backend/src/core/stripe-service.ts:322), [client request lifecycle](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/WalletSwap.svelte:23).

## Performance work worth doing

### 15. P2: wallet discovery serializes provider calls and duplicates concurrent work

**Measured with synthetic 40 ms provider responses.** An empty coin wallet required five calls, peak concurrency one, and 209 ms. A populated address adds two more sequential calls for outputs and history. Scanning all 120 used addresses can require 360 calls per coin. BTC and LTC run in parallel with each other, but each coin's scan stays sequential. The cache stores completed responses only, so concurrent cold requests duplicate the entire operation. ETH and USDT also request the same address nonce separately.

Use bounded address batches, fetch outputs and history together, share the EVM nonce read, and coalesce identical in-flight overview requests. Propagate cancellation so a client timeout does not leave the full scan running. An empty-wallet batch has roughly 5x network-wait headroom in this fixture; that is an estimate, not a measured production improvement. Sweep also fetches previous transactions serially for every txid, including witness inputs that do not require that data.

Sources: [discovery](/home/mesh/Code/ShadowSelf/application/backend/src/utils/crypto-nodes.ts:17), [cache](/home/mesh/Code/ShadowSelf/application/backend/src/core/states.ts:47), [EVM reads](/home/mesh/Code/ShadowSelf/application/backend/src/utils/crypto-nodes.ts:146), [sweep transaction fetch](/home/mesh/Code/ShadowSelf/application/backend/src/core/chain-provider.ts:90).

### 16. P2: entering an identity loads wallet code before the user needs it

**Measured from the successful production build.** The identity route's static import graph totals 1,144,663 JavaScript bytes, approximately 380,122 bytes gzipped across 22 chunks. Its route chunk alone is 682,464 bytes. The route statically imports every service panel, and Wallet imports signing utilities even when Information is the selected tab. Separate dynamic chunks include Monero at 3,781,221 bytes, approximately 2.12 MB gzipped, and the QR scanner at 368,617 bytes.

Load service panels when selected and load transaction signing when preparing a transfer. Keep Monero and camera libraries behind explicit actions. Measure transferred bytes and interaction latency on a throttled mobile device before and after. Dynamic chunk sizes above do not mean they are all fetched on initial navigation.

Sources: [identity imports](/home/mesh/Code/ShadowSelf/application/frontend/src/routes/identity/[slug]/+page.svelte:15), [Wallet imports](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/Wallet.svelte:15), [transfer imports](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/WalletTransfer.svelte:2), production `.vite/manifest.json`.

### 17. P2: opening a mailbox downloads and parses bodies and attachments from four folders

**Reviewed; IMAP probe also confirms read-state mutation.** Initial fetch opens INBOX, Sent, Drafts, and Junk sequentially and fetches up to ten full messages from each. Attachments are encoded into the list response, even if the user opens none. Parsing marks messages Seen, including during initial listing and live notification handling. The UI has no real unread state.

Separate envelope listing from explicit message-body retrieval, paginate per folder, and fetch attachments on demand. Mark read when the user opens a message, rather than when a background fetch parses it. Also distinguish Junk retention cleanup from interactive listing so old messages outside the fetched page do not evade that cleanup path.

Sources: [initial fetch](/home/mesh/Code/ShadowSelf/application/backend/src/utils/email-imap.ts:130), [full-message fetch](/home/mesh/Code/ShadowSelf/application/backend/src/utils/email-imap.ts:267), [read mutation and attachments](/home/mesh/Code/ShadowSelf/application/backend/src/utils/email-imap.ts:293).

### 18. P2: invoice work and query costs grow with abandoned purchases

**Reviewed; no production-scale timings or query plans claimed.** Every poll includes expired and late invoices indefinitely, processes them sequentially, performs multiple observation queries per invoice, and saves wallet state whenever the selected set is nonempty. The observation queries filter by invoice ID and order by ID, but the schema has no index for that access pattern. Identity listing similarly counts accounts per identity without an accounts-owner index. Invoice polling and invoice address allocation also contend on the global billing-wallet lock.

Introduce an explicit monitoring/reconciliation policy that still detects late payments. Add indexes for actual query patterns in the fresh schema, isolate failed invoices, and avoid unchanged writes. Measure poll duration against the 15-second configured interval, rows visited, lock contention, and wallet save size using synthetic growing datasets.

Sources: [invoice selection](/home/mesh/Code/ShadowSelf/application/backend/src/core/background-workers.ts:24), [observation queries](/home/mesh/Code/ShadowSelf/application/backend/src/core/background-workers.ts:37), [wallet save](/home/mesh/Code/ShadowSelf/application/backend/src/core/background-workers.ts:115), [billing lock](/home/mesh/Code/ShadowSelf/application/backend/src/core/wallet-service.ts:120), [schema](/home/mesh/Code/ShadowSelf/application/database/schemas.sql:142), [identity counts](/home/mesh/Code/ShadowSelf/application/backend/src/routes/public-api/index.ts:18).

### 19. P2: SMS loading and deletion are expensive and silently incomplete

**Reviewed.** Conversation listing fetches up to 1,000 sent and 1,000 received messages, then discards everything except the newest message per contact. Full conversation retrieval uses the same cap. Delete conversation removes those fetched messages one by one and returns success without checking whether older messages remain. The dialog promises all messages will be removed. Slow deletion can also outlive the client's 30-second timeout.

Use explicit cursors and completeness information, fetch only the summaries needed for the list, and delete through a resumable operation with bounded provider concurrency. Do not promise complete deletion when capped retrieval cannot establish it.

Sources: [provider list and delete](/home/mesh/Code/ShadowSelf/application/backend/src/core/phone-provider.ts:10), [delete endpoint](/home/mesh/Code/ShadowSelf/application/backend/src/routes/public-api/api-phone.ts:41), [UI promise](/home/mesh/Code/ShadowSelf/application/frontend/src/lib/components/console/Phone.svelte:228).

## Evaluation and product cleanup

### 20. P2: the verification pipeline has no behavioral regression suite

**Repository scan confirmed.** I found no application unit, integration, contract, or end-to-end test files. CI runs dependency audit, formatting, lint, type checks, build, and extension packaging. Those pass while the reproduced bugs remain. Provider constructors have injection points in some places, but several factories are not exported, and billing/IMAP behavior still needs isolated adapters and database fixtures.

First add permanent tests for mailbox-scoped forwarding, wallet history aggregation, discovery bounds, nonce handling, pending account deletion, and invoice failure isolation. Add browser regressions for tab-switch races and sorting. Keep provider fixtures synthetic and isolate the database.

Sources: [CI](/home/mesh/Code/ShadowSelf/.github/workflows/verify.yml), [scripts](/home/mesh/Code/ShadowSelf/package.json), [application factory](/home/mesh/Code/ShadowSelf/application/backend/src/app.ts:19).

### 21. P3: signup and dashboard contain avoidable friction and filler

**Reviewed, with initial signup and dashboard sorting inspected in-browser.** Signup is a ten-stage sequence, including separate authenticator display and verification screens, optional billing before account creation, and a final completion screen. Reload starts the UI at step one despite retaining a signup cookie; there is no server load that restores the current draft stage. This imposes navigation without adding much decision value. Separately, every dashboard identity displays Balance not loaded because the API always returns `walletFunds: null`; there is no dashboard action that loads it.

Combine authenticator enrollment and verification, complete account creation after the required choices, and move optional card setup to purchase/settings. Support restoring a valid signup draft or clearly restarting an expired one. Remove the permanently unavailable dashboard balance row until it offers useful information.

Sources: [signup stages](/home/mesh/Code/ShadowSelf/application/frontend/src/routes/signup/+page.svelte:46), [signup actions](/home/mesh/Code/ShadowSelf/application/frontend/src/routes/signup/+page.server.ts), [balance placeholder](/home/mesh/Code/ShadowSelf/application/backend/src/routes/public-api/index.ts:32), [dashboard row](/home/mesh/Code/ShadowSelf/application/frontend/src/routes/dashboard/+page.svelte:79).

## Smaller cleanup findings

- The shared frontend response types combine unrelated endpoint shapes. `CryptoAPI` requires prices and a full wallet even for swap-only responses; `EmailAPI` requires an inbox for send-only responses. Nullable backend fields also appear as nonnullable frontend strings. Split these by actual contracts so type checks can catch missing fields such as the invoice memo.
- `checkAPI` is a large string-dispatched validator that returns the original untyped body, including unvalidated extra fields. Replace it incrementally at the reviewed contracts with explicit request shapes and bounded values. No new validation package is necessary to begin.
- Both socket manager classes implement the same map operations. A single typed manager would remove duplicate logic without adding tiny helpers.
- The limiter scans every active entry for expiry on every request. The synthetic probe measured 1,000 calls at 4.12 ms with 100 entries, 10 ms with 1,000, and 57.24 ms with 10,000. Move expiry cleanup off the request hot path. This is a smaller gain than reducing provider calls.
- Identity listing selects full rows and resizes every portrait again on each response, including extension refreshes. Normalize portraits when saving them and select only required columns. Avoid caching private identity records across authorization boundaries.
- Diagnostic logs often remove the failure cause entirely. Keep structured operation/error categories and safe provider status information while redacting credentials, message content, and private payloads. Current generic worker failures make reconciliation unnecessarily difficult.
- The former network response is still consumed by the extension docs and explicitly represents unavailable routing. I did not treat it as unused compatibility code. A textual exported-symbol scan found no unreferenced exported runtime symbols; this is not a complete dead-code proof and does not justify another wholesale cleanup pass.

## Recommended order

1. Fix mailbox identity, wallet history aggregation, discovery bounds, and transaction freshness. Add their failing regression tests first.
2. Fix payment memos, invoice failure isolation, pending account deletion, and uncertain-operation recovery.
3. Fix browser races, profile persistence, sorting, and verification-link activation.
4. Split service loading and wallet availability; batch/coalesce provider work; separate mail envelopes from bodies and attachments.
5. Benchmark invoice and SMS workloads, then simplify signup and remove permanent placeholder UI.

The performance work needs separate measurements for cold and cached wallet requests, initial identity-route bytes, mailbox response size, invoice poll duration, and SMS page/deletion latency. An overall page-load score would hide the expensive workflows.

## Evidence and validation limits

Checks completed successfully: `bun format`, `bun lint`, `bun run check`, `bun run build`, and `bun run audit`. Formatting reported every file unchanged. Dependency audit reported no vulnerabilities in the three package roots. Build warnings included browser-externalized `child_process` and `vm` imports; the build still completed. The local Bun executable is 1.3.11 while package metadata and CI pin 1.4.3, so these checks do not establish behavior under the exact pinned runtime.

The isolated audit script imports the real provider/validation functions with synthetic data and a mocked IMAP connection. It makes no provider requests or database writes. Run from the repository root:

```sh
bun --tsconfig-override application/backend/tsconfig.json /tmp/shadowself-audit.ts --verify
```

It intentionally exits 1 on the current implementation, asserting four reproduced regressions. Raw synthetic outputs are in `/tmp/shadowself-audit-results.jsonl`; the assertion log is in `/tmp/shadowself-audit-repro.log`. These are review artifacts outside the repository, not a permanent test suite. Bun also emitted an internal tsconfig directory-mismatch diagnostic, separate from the application assertions.

T3 browser probes mounted the real Mail, Wallet, Phone, and Dashboard components with synthetic responses. They reproduced mailbox contamination, the duplicate-key wallet error, and reversed sorting. Fixtures and fetch overrides were removed afterward. Initial public pages were inspected at 390 by 844 through DOM/layout checks with no horizontal overflow on the sampled routes. The homepage and component probes were also exercised at 1280 by 800. T3 snapshot calls later failed, and the desktop host disconnected during the remaining desktop pass, so a complete visual/desktop review could not be finished.

Mobile public-route checks covered `/`, `/login`, `/signup`, `/docs`, `/extension`, `/contact`, `/about`, `/faq`, and the three policy routes. Authenticated route loading, actual signup delivery, live Stripe/Twilio/IMAP/chain behavior, paid provisioning, real transactions, deployment containers, and an installed browser extension were not exercised. Payment, SQL-scale, and provider-recovery findings above are explicitly reviewed risks rather than claimed live reproductions.

The current working tree, including the existing uncommitted rewrite, was the audit target. The screenshot supplied conversation titles only; earlier conversation contents were not available to this audit.
