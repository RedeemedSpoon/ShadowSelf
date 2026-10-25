import {MAIL_DOMAIN} from '$constant';
import type {ApiDocumentationGroup} from '$type';

export const API_KEY_TEST_DOCUMENTATION: ApiDocumentationGroup = {
  id: 'request-example',
  title: 'Test your API key',
  icon: 'code',
  feature: 'identity',
  endpoints: [
    {
      method: 'GET',
      path: '/api/auth/test',
      detail: 'Check that API access is enabled and your API key is valid without changing identity data.',
      response: {authenticated: true},
    },
  ],
};

export const API_DOCUMENTATION: ApiDocumentationGroup[] = [
  {
    id: 'identities-creation',
    guide: 'identity',
    title: 'Identities and creation',
    icon: 'user',
    feature: 'identity',
    endpoints: [
      {
        method: 'GET',
        path: '/api/identities',
        detail:
          'Returns `{identities:[{id,picture,name,country,location,email,phone,accounts,status,paymentMethod,plan}]}`. Profile fields can be `null` before provisioning. Use GET `/wallet` for verified balances; accounts is the vault entry count.',
        response: {
          identities: [
            {
              id: 'c07000000000',
              picture: null,
              name: 'Dario Moretti',
              country: null,
              location: 'Trieste, Italy',
              email: 'dario.moretti@example.test',
              phone: '+12025550100',
              accounts: 0,
              status: 'active',
              paymentMethod: 'fiat',
              plan: 'monthly',
            },
          ],
        },
      },
      {
        method: 'GET',
        path: '/api/identities/:id',
        detail:
          'Return identity metadata, profile fields, `walletKeys`, `walletBlob`, `vaultRevision`, and optional refund metadata as shown below. `plan` is `monthly`, `annually`, or `lifetime`. The `btc`, `ltc`, and `evm` wallet keys are public; `xmr` keys are encrypted. Provider credentials are excluded.',
        response: {
          id: 'c07000000001',
          plan: 'monthly',
          location: 'Kyoto, Japan',
          picture: null,
          name: 'Elliot Sato',
          bio: 'A translator with a growing collection of field recordings.',
          age: 27,
          sex: 'male',
          ethnicity: 'east asian',
          email: 'elliot.sato@example.test',
          phone: '+12025550102',
          vaultRevision: 1,
          creationDate: '2026-10-25T10:00:00.000Z',
          status: 'active',
          walletKeys: {
            btc: '<public extended key>',
            ltc: '<public extended key>',
            evm: '<public Ethereum address>',
            xmr: {
              address: '<encrypted address>',
              viewKey: '<encrypted view key>',
              spendKey: '<encrypted spend key>',
            },
          },
          walletBlob: '<encrypted wallet blob>',
          paymentMethod: 'fiat',
          cryptoRefund: null,
        },
      },
      {
        method: 'PATCH',
        path: '/api/identities/:id/profile',
        detail:
          'Update any subset of `name`, `bio`, `sex`, `age`, `ethnicity`, and `picture`. Picture is base64 image data. Returns the saved profile fields.',
        request: {name: 'Mara Jensen', bio: 'An architect sketching the places between buildings.'},
        response: {
          name: 'Mara Jensen',
          sex: 'female',
          age: 28,
          ethnicity: 'caucasian',
          bio: 'An architect sketching the places between buildings.',
          picture: '<base64 image>',
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/profile/picture',
        detail:
          'Generate and save a portrait. Optional `sex`, `age`, `ethnicity`, and `bio` override the current profile values. Returns `picture` as base64 image data.',
        request: {
          sex: 'male',
          age: 29,
          ethnicity: 'arab',
          bio: 'A ceramicist working with local clay and natural glazes.',
        },
        response: {picture: '<base64 image>'},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/profile/name',
        detail:
          'Generate and save a name locally. Optional `sex` overrides the current profile value. Returns the saved `name`.',
        request: {sex: 'male'},
        response: {name: 'Jonas Berg'},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/profile/bio',
        detail: 'Generate and save a biography locally. No request body required. Returns the saved `bio`.',
        response: {bio: 'A botanist documenting plants along mountain trails.'},
      },
      {
        method: 'DELETE',
        path: '/api/identities/:id',
        detail:
          'Requires `{currentPassword,refundAddress?}`. An optional external mainnet XMR `refundAddress` requests an eligible crypto refund when identity metadata has `cryptoRefund`. Omitting it deletes the identity without requesting a crypto refund. Returns `{success:true}` after deletion. Subscription cancellation and eligible refunds continue automatically. Crypto refunds use the initial discounted USD purchase value, converted at signing; renewals are excluded and ShadowSelf pays the outgoing fee.',
        request: {currentPassword: 'Example-Account-Password-2026!'},
        response: {success: true},
      },
      {
        method: 'GET',
        path: '/api/identities/:id/creation',
        detail:
          'Returns the saved draft, identity status, and `creationStatus`. Profile location is descriptive text, independent of network allocation. `creationStatus` is editing, provisioning, or completed. The draft accepts fields until provisioning reserves resources.',
        response: {
          draft: {
            location: 'Valencia, Spain',
            profile: {
              name: 'Mateo Alvarez',
              sex: 'male',
              age: 33,
              ethnicity: 'hispanic',
              bio: 'An illustrator drawing everyday street scenes.',
              picture: '<base64 image>',
            },
          },
          status: 'inactive',
          creationStatus: 'editing',
        },
      },
      {
        method: 'PUT',
        path: '/api/identities/:id/creation',
        detail:
          'Save any subset of `location`, `profile`, `email`, `phone`, and `wallet`. The profile includes `picture`. The wallet requires `blob` and `keys`, containing `btc`, `ltc`, `evm`, and encrypted `xmr` fields `address`, `viewKey`, and `spendKey`. Draft fields are merged; provisioning locks edits. Returns the saved `draft`.',
        request: {
          location: 'Kochi, India',
          profile: {
            name: 'Ravi Nair',
            sex: 'male',
            age: 34,
            ethnicity: 'south asian',
            bio: 'A product designer who collects old maps.',
            picture: '<base64 image>',
          },
          email: `ravi.nair@${MAIL_DOMAIN}`,
          phone: '+12025550116',
        },
        response: {
          draft: {
            location: 'Kochi, India',
            profile: {
              name: 'Ravi Nair',
              sex: 'male',
              age: 34,
              ethnicity: 'south asian',
              bio: 'A product designer who collects old maps.',
              picture: '<base64 image>',
            },
            email: `ravi.nair@${MAIL_DOMAIN}`,
            phone: '+12025550116',
          },
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/creation/profile',
        detail:
          'Generate and save a profile and portrait. Use `regenerate` to supply `name`, `bio`, `age`, `sex`, and `ethnicity`. Use `repeat` to request local name and biography suggestions without generating a portrait. The example shows the `repeat` variant.',
        request: {location: 'Turku, Finland', repeat: {name: true, bio: true, sex: 'male'}},
        response: {repeat: {name: 'Niko Lehtinen', bio: 'A woodworker learning traditional boatbuilding.'}},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/creation/email',
        detail:
          'Suggest an email local part from `profile`. Returns `email` without the domain. Does not reserve a mailbox.',
        request: {
          profile: {
            name: 'Owen Brooks',
            sex: 'male',
            age: 36,
            ethnicity: 'caucasian',
            bio: 'A gardener testing small urban growing spaces.',
            picture: '<base64 image>',
          },
        },
        response: {email: 'owenbrooks'},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/creation/phones',
        detail:
          'List available phone numbers for `email` and optional `location`. Returns a `phone` array. Requires a configured phone provider.',
        request: {email: `emilfischer@${MAIL_DOMAIN}`, location: 'Leipzig, Germany'},
        response: {phone: ['+12025550122']},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/creation/provision',
        detail:
          'Provision the saved, validated draft. Retry the same identity after interruption. A completed identity returns its original success; an ongoing provision rejects draft edits.',
        request: {},
        response: {success: true, identityID: 'c0700000000c'},
      },
    ],
  },
  {
    id: 'vault',
    guide: 'vault',
    title: 'Account vault',
    icon: 'key',
    feature: 'vault',
    endpoints: [
      {
        method: 'GET',
        path: '/api/identities/:id/vault',
        detail:
          'Returns one consistent `{accounts,vaultRevision,walletBlob}` snapshot. Frozen identities retain read access.',
        response: {
          accounts: [
            {
              id: 114,
              username: 'soren_dahl',
              password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
              website: 'https://example.com',
              totp: null,
              algorithm: null,
            },
          ],
          vaultRevision: 1,
          walletBlob: '<current encrypted wallet blob>',
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/vault/entries',
        detail:
          'Create a vault entry with `username`, encrypted `password`, and optional `website`, `totp`, and `algorithm`. Send the current `vaultRevision` and `walletBlob` encryption context. Returns the saved entry and incremented `vaultRevision`.',
        request: {
          username: 'noah_kim',
          password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          website: 'https://example.com',
          totp: null,
          vaultRevision: 1,
          walletBlob: '<current encrypted wallet blob>',
        },
        response: {
          id: 115,
          username: 'noah_kim',
          password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          website: 'https://example.com',
          totp: null,
          vaultRevision: 2,
        },
      },
      {
        method: 'PATCH',
        path: '/api/identities/:id/vault/entries',
        detail:
          'Update a vault entry by `id` with `username`, `password`, and optional `website`, `totp`, and `algorithm`. Send the current `vaultRevision` and `walletBlob`. Returns the updated entry and incremented `vaultRevision`.',
        request: {
          id: 116,
          username: 'ada_bellini',
          password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          website: 'https://example.com',
          totp: null,
          vaultRevision: 2,
          walletBlob: '<current encrypted wallet blob>',
        },
        response: {
          id: 116,
          username: 'ada_bellini',
          password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          website: 'https://example.com',
          totp: null,
          vaultRevision: 3,
        },
      },
      {
        method: 'DELETE',
        path: '/api/identities/:id/vault/entries',
        detail:
          'Delete a vault entry by `id`. Send the current `vaultRevision` and `walletBlob`. Returns the deleted `id` and incremented `vaultRevision`.',
        request: {id: 117, vaultRevision: 3, walletBlob: '<current encrypted wallet blob>'},
        response: {id: 117, vaultRevision: 4},
      },
      {
        method: 'PUT',
        path: '/api/identities/:id/vault/encryption',
        detail:
          'Atomically replace all vault ciphertext, wallet phrase blob, and encrypted Monero keys. `walletBlob` must match the current encryption context. `accounts` must include every current entry exactly once. `keys` contains only the encrypted Monero fields; public keys stay unchanged.',
        request: {
          vaultRevision: 4,
          walletBlob: '<current encrypted wallet blob>',
          accounts: [{id: 118, password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>', totp: null}],
          blob: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          keys: {
            address: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
            viewKey: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
            spendKey: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          },
        },
        response: {
          accounts: [{id: 118, password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>', totp: null}],
          blob: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          keys: {
            address: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
            viewKey: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
            spendKey: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          },
          vaultRevision: 5,
        },
      },
    ],
  },
  {
    id: 'email',
    guide: 'email',
    title: 'Email',
    icon: 'mail',
    feature: 'email',
    endpoints: [
      {
        method: 'GET',
        path: '/api/identities/:id/mail/messages',
        detail:
          'List one mailbox without downloading bodies or attachments or marking messages read. `before` is an optional positive UID cursor. `complete` indicates whether earlier messages remain.',
        query: '?mailbox=Inbox&before=42',
        response: {
          mailbox: 'Inbox',
          messages: [],
          messagesCount: 0,
          nextCursor: null,
          complete: true,
        },
      },
      {
        method: 'GET',
        path: '/api/identities/:id/mail/message',
        detail:
          'Open one mailbox-scoped message and explicitly mark it read. Returns `{email}` with body and indexed attachment metadata, excluding attachment bytes.',
        query: '?mailbox=Inbox&uid=219',
        response: {
          email: {
            mailbox: 'Inbox',
            uid: 219,
            messageID: '<message-20@example.test>',
            subject: 'Project update',
            from: 'contact.20@example.test',
            to: 'ines.vidal@example.test',
            date: '2026-10-25T10:00:00.000Z',
            read: true,
            inReplyTo: null,
            references: [],
            attachments: [],
            body: 'The photos are ready.',
            type: 'text',
          },
        },
      },
      {
        method: 'GET',
        path: '/api/identities/:id/mail/attachment',
        detail:
          'Download one indexed attachment from exactly that mailbox and UID. Returns `{attachment}` with base64 data. Missing messages or attachments return 404.',
        query: '?mailbox=Inbox&uid=220&index=0',
        response: {
          attachment: {
            index: 0,
            filename: 'photo.jpg',
            contentType: 'image/jpeg',
            data: '<base64 attachment bytes>',
          },
        },
      },

      {
        method: 'GET',
        path: '/api/identities/:id/mail/reply',
        detail:
          'Find a message by exact Message-ID in Inbox or Sent. Returns `{fetchEmail: Email|null}` with attachment metadata; preserves read state.',
        query: '?uuid=%3Cmessage-22%40example.test%3E',
        response: {
          fetchEmail: {
            mailbox: 'Inbox',
            uid: 221,
            messageID: '<message-22@example.test>',
            subject: 'Project update',
            from: 'contact.22@example.test',
            to: 'freya.lund@example.test',
            date: '2026-10-25T10:00:00.000Z',
            read: true,
            inReplyTo: null,
            references: [],
            attachments: [],
            body: 'The photos are ready.',
            type: 'text',
          },
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/mail/messages',
        detail:
          'Send email with explicit `type` of `text` or `html` and a stable UUID `requestID`. Reuse that ID for retries; HTTP 202 means delivery is uncertain and must not be sent as a new request. Optional `inReplyTo` is a Message-ID, `references` is a Message-ID array, `attachments` is [`{filename,data}`] with base64 data, and `draft` is the old Drafts UID. Returns `{status,draft?,sentEmail,warning?}`. A `warning` means delivery succeeded but mailbox cleanup failed; do not resend.',
        request: {
          requestID: '3834726a-9288-5eb0-a382-0f5646cd22c7',
          to: 'bruno.costa@example.test',
          subject: 'Project update',
          body: 'The photos are ready.',
          type: 'text',
          references: [],
          attachments: [],
        },
        response: {
          status: 'sent',
          sentEmail: {
            to: 'bruno.costa@example.test',
            subject: 'Project update',
            body: 'The photos are ready.',
            type: 'text',
            references: [],
            attachments: [],
            messageID: '<message-23@example.test>',
            date: '2026-10-25T10:00:00.000Z',
            uid: 322,
          },
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/mail/forward',
        detail:
          'Forward exactly one mailbox-scoped UID, including its attachments. Reuse a stable UUID `requestID` for retries; HTTP 202 retains uncertain delivery. `warning` means delivery succeeded but saving Sent failed; do not resend.',
        request: {
          mailbox: 'Inbox',
          uid: 223,
          forward: 'anika.rao@example.test',
          requestID: 'b17e9658-6e62-5736-bdb7-7d8e94cfc734',
        },
        response: {
          uid: 223,
          forward: 'anika.rao@example.test',
          forwardEmail: {
            to: 'anika.rao@example.test',
            subject: 'Project update',
            body: 'The photos are ready.',
            type: 'text',
            references: [],
            attachments: [],
            messageID: '<message-24@example.test>',
            date: '2026-10-25T10:00:00.000Z',
            uid: 323,
          },
        },
      },
      {
        method: 'PUT',
        path: '/api/identities/:id/mail/draft',
        detail:
          'Save the composer payload with explicit `type` of `text` or `html` in Drafts. Unfinished recipient, subject and body may be empty. Optional `draft` identifies the previous UID to replace. Returns `{draft?,savedDraft,warning?}`. When removing the previous draft fails, the new draft remains saved.',
        request: {
          requestID: 'feb63d9a-9255-5bae-a7aa-f392e1592005',
          to: 'celia.mendez@example.test',
          subject: 'Project update',
          body: 'The photos are ready.',
          type: 'text',
          references: [],
          attachments: [],
        },
        response: {
          savedDraft: {
            to: 'celia.mendez@example.test',
            subject: 'Project update',
            body: 'The photos are ready.',
            type: 'text',
            references: [],
            attachments: [],
            messageID: '<message-25@example.test>',
            date: '2026-10-25T10:00:00.000Z',
            uid: 324,
          },
        },
      },
      {
        method: 'DELETE',
        path: '/api/identities/:id/mail/messages',
        detail:
          '`mailbox` must be `Inbox`, `Sent`, `Drafts`, or `Junk`. Deletion moves a message into Junk; deletion from Junk removes it permanently.',
        request: {mailbox: 'Inbox', uid: 225},
        response: {mailbox: 'Inbox', uid: 225},
      },
    ],
  },
  {
    id: 'phone',
    guide: 'phone',
    title: 'Phone',
    icon: 'phone',
    feature: 'phone',
    endpoints: [
      {
        method: 'GET',
        path: '/api/identities/:id/phone/conversations',
        detail:
          'List a bounded page of contact summaries. Merge contacts across pages using the newest message date. `cursor` is an opaque continuation token.',
        query: '?cursor=<opaque cursor>',
        response: {
          messages: [],
          nextCursor: null,
          complete: true,
        },
      },
      {
        method: 'GET',
        path: '/api/identities/:id/phone/conversation',
        detail: 'Read a bounded message page for another E.164 number. Older pages use the opaque `nextCursor`.',
        query: '?addressee=%2B12025550154',
        response: {
          addressee: '+12025550154',
          messages: [],
          nextCursor: null,
          complete: true,
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/phone/messages',
        detail:
          'Send an SMS to another E.164 number. Message body supports 1 to 160 characters. Returns `{addressee,messageSent}`; `messageSent` is a phone message record.',
        request: {addressee: '+12025550156', body: 'The photos are ready.'},
        response: {
          addressee: '+12025550156',
          messageSent: {
            messageID: '<provider message ID>',
            status: 'sent',
            date: '2026-10-25T10:00:00.000Z',
            error: '',
            body: 'The photos are ready.',
            from: '+12025550157',
            to: '+12025550156',
          },
        },
      },
      {
        method: 'DELETE',
        path: '/api/identities/:id/phone/conversations',
        detail:
          'Delete a bounded batch. Repeat the same request until `complete=true`. A timeout is unconfirmed; retry removes remaining provider messages. A fresh empty-provider check confirms completion.',
        request: {
          addressee: '+12025550158',
        },
        response: {
          addressee: '+12025550158',
          deleted: 60,
          failed: 0,
          complete: false,
        },
      },
    ],
  },
  {
    id: 'wallets',
    guide: 'wallet',
    title: 'Cryptocurrency wallets',
    icon: 'wallet',
    feature: 'wallet',
    endpoints: [
      {
        method: 'GET',
        path: '/api/identities/:id/wallet',
        detail:
          'Return `wallet`, `prices`, and `fees`. Each coin has an independent state. Unavailable balances are `null` with `status="Unavailable"` and an `error`. The example shows unavailable providers; missing prices and fees remain unavailable. BTC and LTC scan receive and change branches, all issued addresses, and a trailing discovery gap. Unspent outputs carry `branch` and `pathIndex`. A `status="Incomplete"` result with `null` address indices disables new addresses. No balance cache is used.',
        response: {
          prices: {},
          fees: {},
          wallet: {
            btc: {
              status: 'Unavailable',
              balance: null,
              history: [],
              error: 'Provider is unavailable.',
            },
            ltc: {
              status: 'Unavailable',
              balance: null,
              history: [],
              error: 'Provider is unavailable.',
            },
            eth: {
              status: 'Unavailable',
              balance: null,
              history: [],
              error: 'Provider is unavailable.',
            },
            usdt: {
              status: 'Unavailable',
              balance: null,
              history: [],
              error: 'Provider is unavailable.',
            },
          },
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/history',
        detail:
          'Continue BTC/LTC/ETH/USDT history using the opaque `historyCursor` from the wallet response. Returns history, `historyCursor` and optional `historyError`. A null cursor completes confirmed history. `reset=true` replaces previously loaded history when an Ethereum explorer fallback restarts pagination. Balances remain fresh independently of history availability.',
        request: {coin: 'btc', cursor: '<opaque historyCursor>'},
        response: {
          history: [],
          historyCursor: null,
          reset: false,
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/addresses',
        detail:
          'Reserve an unused BTC/LTC address after fresh discovery. `branch=0` receives payments; `branch=1` receives change. `requestID` is an idempotency UUID. Retry the same ID after interruption. Response address must be checked against the locally derived xpub address. Reservations survive unpaid invoices and prevent address reuse.',
        request: {coin: 'btc', branch: 0, requestID: '<UUID>'},
        response: {coin: 'btc', branch: 0, index: 0, address: '<derived receive address>'},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/utxos/verify',
        detail:
          'Freshly verify selected outpoints, values and addresses immediately before signing and broadcasting. Changed or spent inputs return 409 inputs_changed. This does not reserve blockchain funds or make a provider independently trustworthy.',
        request: {coin: 'btc', utxos: [{txid: 'a'.repeat(64), vout: 0, value: 100000, address: '<owned address>'}]},
        response: {verified: true},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/prepare',
        detail:
          'Estimate an ETH or Ethereum ERC-20 USDT transfer against pending state. Returns numeric `nonce`, plus `ethBalanceAtoms`, `usdtBalanceAtoms`, `amountAtoms`, `gasLimit`, `maxFeePerGas`, and `maxPriorityFeePerGas` as atomic-unit strings. Optional `address` selects an imported sender. Set `sweep=true` to prepare the entire spendable balance. Persist unresolved signed bytes and retry those bytes only.',
        request: {
          coin: 'eth',
          recipient: '0x1111111111111111111111111111111111111111',
          amount: '0.01',
          priority: 'medium',
        },
        response: {
          nonce: 2,
          ethBalanceAtoms: '100000000000000000',
          usdtBalanceAtoms: '0',
          amountAtoms: '10000000000000000',
          gasLimit: '21000',
          maxFeePerGas: '2000000000',
          maxPriorityFeePerGas: '1000000000',
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/transactions/reconcile',
        detail:
          'Reconcile an uncertain payment. BTC and LTC require `coin` and `hex` containing the exact saved signed transaction; returns `txid` and `status` of `confirmed`, `seen`, `conflicted`, or `unknown`. Only confirmation or a verified confirmed competing spend permits clearing the saved payment. ETH and USDT require `coin`, `address`, `txid`, and `nonce`; returns `status` of `consumed`, `seen`, or `unknown`. The example shows an Ethereum result. Unknown sends retain uncertainty; retry the same bytes only.',
        request: {
          coin: 'eth',
          address: '0x1111111111111111111111111111111111111111',
          txid: '0x' + 'a'.repeat(64),
          nonce: 2,
        },
        response: {
          status: 'seen',
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/recovery',
        detail:
          'Explicitly scan at least 1200 addresses per BTC/LTC branch, extended to cover all issued addresses. Discovered bounds persist so later fresh scans cover recovered funds. Incomplete discovery is reported explicitly.',
        request: {
          coin: 'btc',
        },
        response: {
          coin: 'btc',
          wallet: {
            status: 'Synced',
            balance: 0,
            history: [],
            utxos: [],
            nextReceiveIndex: 0,
            nextChangeIndex: 0,
          },
        },
      },
      {
        method: 'GET',
        path: '/api/identities/:id/wallet/node',
        detail:
          'Return the configured Monero `nodeUrl`, network status, and identity `startingDate` for client-side wallet synchronization.',
        response: {
          startingDate: '2026-10-11T00:00:00.000Z',
          status: 'Network Operational',
          nodeUrl: '<configured HTTPS Monero RPC endpoint>',
        },
      },
      {
        method: 'GET',
        path: '/api/identities/:id/wallet/swap-quotes',
        detail:
          'Returns `{tradeID,bestProvider,coinFrom,coinTo,amount,providers:[{isFixed,costPercentage,returnUsd,returnCoin,kycRating,logPolicy,logo,name,eta}]}`. Pick a returned provider and its `isFixed` value for the trade request.',
        query: '?coinFrom=btc&coinTo=xmr&amount=0.01',
        response: {
          tradeID: '<quote reference>',
          bestProvider: '<provider name>',
          coinFrom: 'btc',
          coinTo: 'xmr',
          amount: 0.01,
          providers: [
            {
              isFixed: false,
              costPercentage: 1,
              returnUsd: 650,
              returnCoin: 2.5,
              kycRating: 0,
              logPolicy: '<provider policy>',
              logo: '<logo URL>',
              name: '<provider name>',
              eta: '<provider estimate>',
            },
          ],
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/swaps',
        detail:
          'Create one recoverable swap operation. `requestID` is a UUID and must be reused for retries. Unresolved operations block new requests; inspect GET `/wallet/swaps` and reconcile the same reference.',
        request: {
          tradeID: '<tradeID from quote>',
          coinFrom: 'btc',
          coinTo: 'xmr',
          amount: 0.01,
          destinationAddress: '<destination address>',
          refundAddress: '<refund address>',
          provider: '<provider from quote>',
          isFixed: false,
          requestID: '3cad73c3-4cb9-5e62-9d67-1a7c7cdc5fa4',
        },
        response: {
          status: 'waiting',
          depositAddress: '<provider deposit address>',
          depositAmount: '0.01',
          externalLink: '<provider trade URL>',
        },
      },
      {
        method: 'GET',
        path: '/api/identities/:id/wallet/swaps',
        detail:
          'List up to 50 persisted trade requests, with unresolved operations first and newest entries first within each group. Returns a `swaps` array containing `requestID`, `status`, `createdAt`, the original `request`, and nullable provider `response`. Keep unresolved references for reconciliation.',
        response: {
          swaps: [
            {
              requestID: 'a7ac6240-d930-5ea5-87df-0db291f9315a',
              status: 'completed',
              createdAt: '2026-10-25T10:00:00.000Z',
              request: {
                coinFrom: 'btc',
                coinTo: 'xmr',
                amount: 0.01,
                tradeID: '<quote reference>',
                destinationAddress: '<destination address>',
                refundAddress: '<refund address>',
                provider: '<provider name>',
                isFixed: false,
              },
              response: {
                status: 'waiting',
                depositAddress: '<provider deposit address>',
                depositAmount: '0.01',
                externalLink: '<provider trade URL>',
              },
            },
          ],
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/swaps/:requestID/reconcile',
        detail:
          'Look up the existing provider trade without issuing another trade. Replace `:requestID` with the original UUID. Persisted addresses, coins, networks, and amounts must match. Returns `status` and nullable `response`; an unconfirmed lookup also returns a `message` and retains the request for review.',
        response: {
          status: 'completed',
          response: {
            status: 'waiting',
            depositAddress: '<provider deposit address>',
            depositAmount: '0.01',
            externalLink: '<provider trade URL>',
          },
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/transactions',
        detail:
          'Broadcast an already signed BTC, LTC, ETH or USDT transaction. Never submit signing keys. Monero signing and broadcasting happen in the client wallet.',
        request: {coin: 'btc', hex: '<signed transaction hex>'},
        response: {txid: '<accepted transaction hash>'},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/sweep',
        detail:
          'Discover BTC/LTC outputs for imported public addresses before client-side sweep signing. Returns `{utxos,balance}`; amounts are satoshis. For ETH/USDT use POST `/wallet/prepare` with `sweep=true`. Never submit private keys.',
        request: {coin: 'btc', addresses: ['<derived public Bitcoin address>']},
        response: {utxos: [], balance: 0},
      },
    ],
  },
  {
    id: 'service-card',
    title: 'Virtual cards',
    icon: 'card',
    feature: 'card',
    guide: 'card',
    endpoints: [],
  },
  {
    id: 'service-proxy',
    title: 'Residential proxies',
    icon: 'proxy',
    feature: 'proxy',
    guide: 'proxy',
    endpoints: [],
  },
  {
    id: 'service-cloud',
    title: 'Online drive',
    icon: 'cloud',
    feature: 'cloud',
    guide: 'cloud',
    endpoints: [],
  },
  {
    id: 'websockets',
    title: 'WebSockets',
    icon: 'code',
    feature: 'identity',
    endpoints: [
      {
        method: 'WS',
        path: '/api/identities/:id/events',
        detail:
          'Connect over `wss://` with an `Authorization: Bearer <key>` upgrade header. Native browser WebSocket clients cannot set this header; use an authenticated same-origin session or a client that supports upgrade headers. Each incoming email is a JSON text frame with `type="email"` and the mailbox-scoped envelope below. Fetch `/api/identities/:id/mail/message?mailbox=Inbox&uid=244` for its body. No initial snapshot or replay is sent. Reconnect with backoff and reload the mailbox to recover missed events. Close code `1008` means access expired, `1011` means authorization is unavailable, and `1013` means the connection limit was reached. SMS events are planned; this endpoint currently emits email events only.',
        response: {
          type: 'email',
          email: {
            mailbox: 'Inbox',
            uid: 244,
            messageID: '<message-45@example.test>',
            subject: 'Project update',
            from: 'contact.45@example.test',
            to: 'linnea.holm@example.test',
            date: '2026-10-25T10:00:00.000Z',
            read: false,
          },
        },
      },
    ],
  },
];
