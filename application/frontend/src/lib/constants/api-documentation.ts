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
          'Returns {identities:[{id,picture,name,country,location,email,phone,accounts,status,paymentMethod,plan}]}. Profile fields can be null before provisioning. Use GET /wallet for verified balances; accounts is the vault entry count.',
      },
      {
        method: 'GET',
        path: '/api/identities/:id',
        detail:
          'Returns {id,plan,location,picture,name,bio,age,sex,ethnicity,email,phone,vaultRevision,creationDate,status,walletKeys,walletBlob,paymentMethod}. plan is monthly, annually, or lifetime. walletKeys contains public btc/ltc/evm keys and encrypted xmr keys. Provider credentials are excluded.',
      },
      {
        method: 'PATCH',
        path: '/api/identities/:id/profile',
        detail:
          'Partial profile update. Allowed fields are name, bio, sex, age, ethnicity, and picture. Picture is base64 image data. Returns the saved profile fields.',
        request: {name: 'Theo Mercer', bio: 'A photographer who enjoys hiking.'},
        response: {
          name: 'Theo Mercer',
          sex: 'male',
          age: 31,
          ethnicity: 'caucasian',
          bio: 'A photographer who enjoys hiking.',
          picture: '<base64 image>',
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/profile/picture',
        detail: 'Optional sex/age/ethnicity/bio → {picture}',
        request: {sex: 'male', age: 31, ethnicity: 'caucasian', bio: 'A photographer who enjoys hiking.'},
        response: {picture: '<base64 image>'},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/profile/name',
        detail: 'Optional sex → {name}',
        request: {sex: 'male'},
        response: {name: 'Theo Mercer'},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/profile/bio',
        detail: 'Generate a biography locally. Empty request body; does not save it until PATCH /profile.',
        response: {bio: 'A photographer who enjoys hiking.'},
      },
      {
        method: 'DELETE',
        path: '/api/identities/:id',
        detail:
          'Requires {currentPassword,refundAddress?}. A valid external mainnet XMR refundAddress is required when identity metadata has cryptoRefund. Returns {success:true} after deletion. Subscription cancellation and eligible refunds continue automatically. Crypto refunds use the initial discounted USD purchase value, converted at signing; renewals are excluded and ShadowSelf pays the outgoing fee.',
        request: {currentPassword: 'Example-Account-Password-2026!'},
        response: {success: true},
      },
      {
        method: 'GET',
        path: '/api/identities/:id/creation',
        detail:
          'Returns the saved draft, identity status, and creationStatus. Profile location is descriptive text, independent of network allocation. creationStatus is editing, provisioning, or completed. The draft accepts fields until provisioning reserves resources.',
        response: {
          draft: {
            location: 'Seattle, United States',
            profile: {
              name: 'Theo Mercer',
              sex: 'male',
              age: 31,
              ethnicity: 'caucasian',
              bio: 'A photographer who enjoys hiking.',
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
          'Save any subset of location, profile, email, phone, and wallet. Profile includes picture. Wallet requires {blob,keys:{btc,ltc,evm,xmr:{address,viewKey,spendKey}}}. Draft fields are merged; provisioning locks edits.',
        request: {
          location: 'Seattle, United States',
          profile: {
            name: 'Theo Mercer',
            sex: 'male',
            age: 31,
            ethnicity: 'caucasian',
            bio: 'A photographer who enjoys hiking.',
            picture: '<base64 image>',
          },
          email: `theo.mercer@${MAIL_DOMAIN}`,
          phone: '+12025550142',
        },
        response: {
          draft: {
            location: 'Seattle, United States',
            profile: {
              name: 'Theo Mercer',
              sex: 'male',
              age: 31,
              ethnicity: 'caucasian',
              bio: 'A photographer who enjoys hiking.',
              picture: '<base64 image>',
            },
            email: `theo.mercer@${MAIL_DOMAIN}`,
            phone: '+12025550142',
          },
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/creation/profile',
        detail:
          'Generate and save a profile and portrait. regenerate supplies name, bio, age, sex and ethnicity. repeat requests local name/bio suggestions without generating a portrait.',
        request: {location: 'Seattle, United States', repeat: {name: true, bio: true, sex: 'male'}},
        response: {repeat: {name: 'Theo Mercer', bio: 'A photographer who enjoys hiking.'}},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/creation/email',
        detail: '{profile} → {email} suggested local part',
        request: {
          profile: {
            name: 'Theo Mercer',
            sex: 'male',
            age: 31,
            ethnicity: 'caucasian',
            bio: 'A photographer who enjoys hiking.',
            picture: '<base64 image>',
          },
        },
        response: {email: 'theomercer'},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/creation/phones',
        detail: '{email,location?} → {phone:[...]}',
        request: {email: `theomercer@${MAIL_DOMAIN}`, location: 'Seattle, United States'},
        response: {phone: ['+12025550142']},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/creation/provision',
        detail:
          'Provision the saved, validated draft. Retry the same identity after interruption. A completed identity returns its original success; an ongoing provision rejects draft edits.',
        request: {},
        response: {success: true, identityID: 'a11ce0000001'},
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
          'Returns one consistent {accounts,vaultRevision,walletBlob} snapshot. Frozen identities retain read access.',
        response: {
          accounts: [
            {
              id: 1,
              username: 'theo_m',
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
          '{username,password,website?,totp?,algorithm?,vaultRevision,walletBlob}; encrypted secrets must match the current walletBlob encryption context',
        request: {
          username: 'theo_m',
          password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          website: 'https://example.com',
          totp: null,
          vaultRevision: 1,
          walletBlob: '<current encrypted wallet blob>',
        },
        response: {
          id: 1,
          username: 'theo_m',
          password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          website: 'https://example.com',
          totp: null,
          vaultRevision: 2,
        },
      },
      {
        method: 'PATCH',
        path: '/api/identities/:id/vault/entries',
        detail: '{id,username,password,website?,totp?,algorithm?,vaultRevision,walletBlob}',
        request: {
          id: 1,
          username: 'theo_m',
          password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          website: 'https://example.com',
          totp: null,
          vaultRevision: 2,
          walletBlob: '<current encrypted wallet blob>',
        },
        response: {
          id: 1,
          username: 'theo_m',
          password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          website: 'https://example.com',
          totp: null,
          vaultRevision: 3,
        },
      },
      {
        method: 'DELETE',
        path: '/api/identities/:id/vault/entries',
        detail: '{id,vaultRevision,walletBlob}',
        request: {id: 1, vaultRevision: 3, walletBlob: '<current encrypted wallet blob>'},
        response: {id: 1, vaultRevision: 4},
      },
      {
        method: 'PUT',
        path: '/api/identities/:id/vault/encryption',
        detail:
          'Atomically replace all vault ciphertext, wallet phrase blob, and encrypted Monero keys. walletBlob must match the current encryption context. accounts must include every current entry exactly once. keys contains only the encrypted Monero fields; public keys stay unchanged.',
        request: {
          vaultRevision: 4,
          walletBlob: '<current encrypted wallet blob>',
          accounts: [{id: 1, password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>', totp: null}],
          blob: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          keys: {
            address: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
            viewKey: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
            spendKey: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          },
        },
        response: {
          accounts: [{id: 1, password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>', totp: null}],
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
          'List one mailbox without downloading bodies or attachments or marking messages read. before is an optional positive UID cursor. complete indicates whether earlier messages remain.',
        query: '?mailbox=INBOX&before=42',
        response: {
          mailbox: 'INBOX',
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
          'Open one mailbox-scoped message and explicitly mark it read. Returns {email} with body and indexed attachment metadata, excluding attachment bytes.',
        query: '?mailbox=INBOX&uid=42',
      },
      {
        method: 'GET',
        path: '/api/identities/:id/mail/attachment',
        detail:
          'Download one indexed attachment from exactly that mailbox and UID. Returns {attachment} with base64 data. Missing messages or attachments return 404.',
        query: '?mailbox=INBOX&uid=42&index=0',
      },

      {
        method: 'GET',
        path: '/api/identities/:id/mail/reply',
        detail:
          'Find a message by exact Message-ID in Inbox or Sent. Returns {fetchEmail: Email|null} with attachment metadata; preserves read state.',
        query: '?uuid=%3Cmessage%40example.com%3E',
      },
      {
        method: 'POST',
        path: '/api/identities/:id/mail/messages',
        detail:
          'Send email with explicit text/html type and a stable UUID requestID. Reuse that ID for retries; HTTP 202 means delivery is uncertain and must not be sent as a new request. Optional inReplyTo is a Message-ID, references is a Message-ID array, attachments is [{filename,data}] with base64 data, and draft is the old Drafts UID. Returns {draft?,sentEmail,warning?}. A warning means delivery succeeded but mailbox cleanup failed; do not resend.',
        request: {
          requestID: 'a879a094-8396-42fc-9e46-73eebfaf1de5',
          to: 'recipient@example.com',
          subject: 'Project update',
          body: 'The updated photos are ready.',
          type: 'text',
          references: [],
          attachments: [],
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/mail/forward',
        detail:
          'Forward exactly one mailbox-scoped UID, including its attachments. Reuse a stable UUID requestID for retries; HTTP 202 retains uncertain delivery. warning means delivery succeeded but saving Sent failed; do not resend.',
        request: {
          mailbox: 'INBOX',
          uid: 42,
          forward: 'recipient@example.com',
          requestID: 'a879a094-8396-42fc-9e46-73eebfaf1de5',
        },
      },
      {
        method: 'PUT',
        path: '/api/identities/:id/mail/draft',
        detail:
          'Save the composer payload with explicit text/html type in Drafts. Unfinished recipient, subject and body may be empty. Optional draft identifies the previous UID to replace. Returns {draft?,savedDraft,warning?}. When removing the previous draft fails, the new draft remains saved.',
        request: {
          requestID: 'a879a094-8396-42fc-9e46-73eebfaf1de5',
          to: 'recipient@example.com',
          subject: 'Project update',
          body: 'The updated photos are ready.',
          type: 'text',
          references: [],
          attachments: [],
        },
      },
      {
        method: 'DELETE',
        path: '/api/identities/:id/mail/messages',
        detail:
          'Mailbox must be INBOX, Sent, Drafts, or Junk. Deletion moves a message into Junk; deletion from Junk removes it permanently.',
        request: {mailbox: 'INBOX', uid: 42},
        response: {mailbox: 'INBOX', uid: 42},
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
          'List a bounded page of contact summaries. Merge contacts across pages using the newest message date. cursor is an opaque continuation token.',
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
        detail: 'Read a bounded message page for another E.164 number. Older pages use the opaque nextCursor.',
        query: '?addressee=%2B12025550142',
        response: {
          addressee: '+12025550142',
          messages: [],
          nextCursor: null,
          complete: true,
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/phone/messages',
        detail:
          'Send an SMS to another E.164 number. Message body supports 1 to 160 characters. Returns {addressee,messageSent}; messageSent is a phone message record.',
        request: {addressee: '+12025550142', body: 'The photos are ready.'},
      },
      {
        method: 'DELETE',
        path: '/api/identities/:id/phone/conversations',
        detail:
          'Delete a bounded batch. Repeat the same request until complete=true. A timeout is unconfirmed; retry removes remaining provider messages. A fresh empty-provider check confirms completion.',
        request: {
          addressee: '+12025550142',
        },
        response: {
          addressee: '+12025550142',
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
          'Returns independent coin states, prices, and fees. Unavailable balances are null with status=Unavailable and an error. Missing price/fee entries remain unavailable. BTC/LTC scan receive and change branches, including all previously issued addresses and a trailing discovery gap. Unspent outputs carry branch and pathIndex. status=Incomplete and null nextReceiveIndex/nextChangeIndex disable new addresses. No balance cache is used.',
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/history',
        detail:
          'Continue BTC/LTC/ETH/USDT history using the opaque historyCursor from the wallet response. Returns history, historyCursor and optional historyError. A null cursor completes confirmed history. reset=true replaces previously loaded history when an Ethereum explorer fallback restarts pagination. Balances remain fresh independently of history availability.',
        request: {coin: 'btc', cursor: '<opaque historyCursor>'},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/addresses',
        detail:
          'Reserve an unused BTC/LTC address after fresh discovery. branch=0 receives payments; branch=1 receives change. requestID is an idempotency UUID. Retry the same ID after interruption. Response address must be checked against the locally derived xpub address. Reservations survive unpaid invoices and prevent address reuse.',
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
          'Estimate the exact ETH or Ethereum ERC-20 USDT transfer against pending state. Returns nonce plus ethBalanceAtoms, usdtBalanceAtoms, amountAtoms, gasLimit, maxFeePerGas and maxPriorityFeePerGas as atomic strings. Optional address selects an imported sender. sweep=true prepares the entire spendable balance. Persist unresolved signed bytes and retry those bytes only.',
        request: {
          coin: 'eth',
          recipient: '0x1111111111111111111111111111111111111111',
          amount: '0.01',
          priority: 'medium',
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/transactions/reconcile',
        detail:
          'BTC/LTC require coin and hex containing the exact saved signed transaction. Returns txid and status=confirmed, seen, conflicted, or unknown. Only confirmation or a verified confirmed competing spend permits clearing the saved payment. ETH/USDT require coin, address, txid, and nonce; status=consumed means the nonce advanced. Unknown sends retain uncertainty and may retry the same bytes only.',
        request: {
          coin: 'eth',
          address: '0x1111111111111111111111111111111111111111',
          txid: '0x' + 'a'.repeat(64),
          nonce: 2,
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
      },
      {
        method: 'GET',
        path: '/api/identities/:id/wallet/node',
        detail: 'Monero node and starting date',
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
          'Returns {tradeID,bestProvider,coinFrom,coinTo,amount,providers:[{isFixed,costPercentage,returnUsd,returnCoin,kycRating,logPolicy,logo,name,eta}]}. Pick a returned provider and its isFixed value for the trade request.',
        query: '?coinFrom=btc&coinTo=xmr&amount=0.01',
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/swaps',
        detail:
          'Create one recoverable swap operation. requestID is a UUID and must be reused for retries. Unresolved operations block new requests; inspect GET /wallet/swaps and reconcile the same reference.',
        request: {
          tradeID: '<tradeID from quote>',
          coinFrom: 'btc',
          coinTo: 'xmr',
          amount: 0.01,
          destinationAddress: '<destination address>',
          refundAddress: '<refund address>',
          provider: '<provider from quote>',
          isFixed: false,
          requestID: 'a879a094-8396-42fc-9e46-73eebfaf1de5',
        },
      },
      {
        method: 'GET',
        path: '/api/identities/:id/wallet/swaps',
        detail:
          'List recent persisted trade requests, including incomplete operations and recovered provider responses.',
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/swaps/:requestID/reconcile',
        detail:
          'Look up the existing provider trade without issuing another trade. Persisted addresses, coins, networks and amounts must match. An unconfirmed lookup retains the request for review.',
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
          'Discover BTC/LTC outputs for imported public addresses before client-side sweep signing. Returns {utxos,balance}; amounts are satoshis. For ETH/USDT use POST /wallet/prepare with sweep=true. Never submit private keys.',
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
          'Connect with valid authentication. Events are {type:"email",email:{...}} and {type:"message",message:{...}}. Send the string ping to receive pong. Fetch mailbox/conversations after reconnecting to recover missed events.',
      },
    ],
  },
];
