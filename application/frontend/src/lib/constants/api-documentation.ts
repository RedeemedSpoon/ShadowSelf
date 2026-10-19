import {MAIL_DOMAIN} from '$constant';
import type {ApiDocumentationGroup} from '$type';

export const API_DOCUMENTATION: ApiDocumentationGroup[] = [
  {
    id: 'authentication-settings',
    title: 'Authentication and settings',
    endpoints: [
      {
        method: 'GET',
        path: '/api/auth/session',
        detail: '{username,email}',
        response: {username: 'Theo', email: 'theo@example.com'},
      },
      {
        method: 'GET',
        path: '/api/auth/recovery-remaining',
        detail: '{recoveryRemaining}',
        response: {recoveryRemaining: 6},
      },
      {
        method: 'POST',
        path: '/api/auth/password',
        detail:
          'Sign in with your account password. A second-factor account returns {challenge,expiresIn:300} instead of a token.',
        request: {email: 'theo@example.com', password: 'Example-Account-Password-2026!'},
        response: {token: 'ss_session_<session token>'},
      },
      {
        method: 'POST',
        path: '/api/auth/email',
        detail: '{email} → {email}',
        request: {email: 'theo@example.com'},
        response: {email: 'theo@example.com'},
      },
      {
        method: 'POST',
        path: '/api/auth/email/verify',
        detail: '{email,access} → token or challenge',
        request: {email: 'theo@example.com', access: '12345678'},
        response: {challenge: '<challenge from sign-in response>', expiresIn: 300},
      },
      {
        method: 'POST',
        path: '/api/auth/second-factor',
        detail: '{challenge,token} → session token',
        request: {challenge: '<challenge from sign-in response>', token: '123456'},
        response: {token: 'ss_session_<session token>'},
      },
      {
        method: 'POST',
        path: '/api/auth/recovery',
        detail: '{challenge,code} → session token',
        request: {challenge: '<challenge from sign-in response>', code: 'abcdef-123456-abcdef-123456'},
        response: {token: 'ss_session_<session token>'},
      },
      {
        method: 'POST',
        path: '/api/auth/registration',
        detail:
          'Start a resumable registration draft. Username is 1 to 25 characters; password is 12 to 256. Enable two-factor authentication with enableTwoFactor.',
        request: {
          email: 'theo@example.com',
          username: 'Theo',
          password: 'Example-Account-Password-2026!',
          enableTwoFactor: true,
        },
        response: {
          signup: '<private signup reference>',
          email: 'theo@example.com',
          expiresIn: 1800,
        },
      },
      {
        method: 'POST',
        path: '/api/auth/registration/resume',
        detail:
          'Restore a valid registration draft through its private reference. Before email verification, enrollment secrets and recovery codes are excluded. Recovery codes remain retrievable within that verified draft until completion or expiry.',
        request: {
          signup: '<signup reference>',
        },
      },
      {
        method: 'POST',
        path: '/api/auth/registration/cancel',
        detail: 'Discard the registration draft.',
        request: {
          signup: '<signup reference>',
        },
      },
      {
        method: 'POST',
        path: '/api/auth/registration/email',
        detail:
          'Verify the email code. Two-factor drafts return authenticator enrollment state. Otherwise ready=true permits account completion.',
        request: {
          signup: '<signup reference>',
          access: '12345678',
        },
        response: {
          stage: 'authenticator',
          email: 'theo@example.com',
          username: 'Theo',
          secret: '<base32 secret>',
          uri: 'otpauth://totp/<enrollment URI>',
        },
      },

      {
        method: 'POST',
        path: '/api/auth/registration/recovery',
        detail:
          'Verify the six-digit TOTP code. Returns six recovery codes; store them before completing registration. A verified draft can restore these codes until completion or expiry.',
        request: {signup: '<signup from registration response>', token: '123456'},
        response: {recovery: ['<six one-time recovery codes>']},
      },
      {
        method: 'POST',
        path: '/api/auth/registration/complete',
        detail:
          'Complete the verified draft. Two-factor enrollment requires a verified authenticator and explicit savedRecovery=true. Optional card setup belongs in account settings or checkout.',
        request: {
          signup: '<signup reference>',
          savedRecovery: true,
        },
        response: {
          token: 'ss_session_<session token>',
        },
      },
      {
        method: 'GET',
        path: '/api/settings',
        detail: '{email,username,recoveryRemaining,API,OTP}',
        response: {email: 'theo@example.com', username: 'Theo', recoveryRemaining: 6, API: false, OTP: true},
      },
      {
        method: 'GET',
        path: '/api/settings/sessions',
        detail: '{sessions:[{id,current,createdAt,expiresAt}]}',
        response: {
          sessions: [
            {
              id: '2e5463b6-13db-4385-9f39-8d53da0d4d1f',
              current: true,
              createdAt: '2026-10-11T00:00:00.000Z',
              expiresAt: '2027-01-09T00:00:00.000Z',
            },
          ],
        },
      },
      {
        method: 'DELETE',
        path: '/api/settings/sessions',
        detail:
          'Provide id to revoke an owned session. Send {} or no body to revoke all sessions, including the current one.',
        request: {id: '2e5463b6-13db-4385-9f39-8d53da0d4d1f'},
        response: {success: true},
      },
      {
        method: 'DELETE',
        path: '/api/settings/session',
        detail: 'logs out current session',
        response: {success: true},
      },
      {
        method: 'GET',
        path: '/api/settings/totp',
        detail: '{secret,uri} enrollment draft',
        response: {secret: '<base32 secret>', uri: 'otpauth://totp/<enrollment URI>'},
      },
      {
        method: 'POST',
        path: '/api/settings/totp',
        detail: '{currentPassword,secret,token} → recovery codes',
        request: {
          currentPassword: 'Example-Account-Password-2026!',
          secret: '<32-character base32 secret>',
          token: '123456',
        },
        response: {recovery: ['<six one-time recovery codes>'], recoveryRemaining: 6},
      },
      {
        method: 'DELETE',
        path: '/api/settings/totp',
        detail: '{currentPassword}',
        request: {currentPassword: 'Example-Account-Password-2026!'},
        response: {recoveryRemaining: 0},
      },
      {
        method: 'POST',
        path: '/api/settings/recovery',
        detail: '{password} → recovery codes',
        request: {password: 'Example-Account-Password-2026!'},
        response: {recovery: ['<six new one-time recovery codes>'], recoveryRemaining: 6},
      },
      {
        method: 'PUT',
        path: '/api/settings/api-access',
        detail: '{currentPassword,enabled:boolean} → {API}',
        request: {currentPassword: 'Example-Account-Password-2026!', enabled: true},
        response: {API: true},
      },
      {
        method: 'POST',
        path: '/api/settings/api-key',
        detail: '{currentPassword} → {key} displayed once',
        request: {currentPassword: 'Example-Account-Password-2026!'},
        response: {key: 'ss_api_<new key shown once>'},
      },
      {
        method: 'POST',
        path: '/api/settings/email',
        detail: '{currentPassword,email} sends verification',
        request: {currentPassword: 'Example-Account-Password-2026!', email: 'new-address@example.com'},
        response: {email: 'new-address@example.com'},
      },
      {
        method: 'PUT',
        path: '/api/settings/email',
        detail: '{currentPassword,email,access} → {token,warning?}',
        request: {
          currentPassword: 'Example-Account-Password-2026!',
          email: 'new-address@example.com',
          access: '12345678',
        },
        response: {token: 'ss_session_<replacement session token>'},
      },
      {
        method: 'PUT',
        path: '/api/settings/username',
        detail: '{currentPassword,username}',
        request: {currentPassword: 'Example-Account-Password-2026!', username: 'Theo'},
        response: {success: true},
      },
      {
        method: 'PUT',
        path: '/api/settings/password',
        detail: '{currentPassword,password} revokes sessions and API key',
        request: {currentPassword: 'Example-Account-Password-2026!', password: 'New-Example-Password-2026!'},
        response: {success: true},
      },
      {
        method: 'POST',
        path: '/api/settings/payment',
        detail: '{currentPassword,payment}',
        request: {currentPassword: 'Example-Account-Password-2026!', payment: 'pm_<Stripe payment-method ID>'},
        response: {sessionUrl: '<Stripe billing portal URL>'},
      },
      {
        method: 'POST',
        path: '/api/settings/billing-portal',
        detail: '{currentPassword}',
        request: {currentPassword: 'Example-Account-Password-2026!'},
        response: {sessionUrl: '<Stripe billing portal URL>'},
      },
      {
        method: 'DELETE',
        path: '/api/settings/account',
        detail: '{currentPassword}; 202 means cleanup is pending',
        request: {currentPassword: 'Example-Account-Password-2026!'},
        response: {success: true},
      },
    ],
  },
  {
    id: 'identities-creation',
    title: 'Identities and creation',
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
          'Requires the account password. Returns {success:true} after deletion. If billing cleanup cannot complete, returns an error so you can retry.',
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
      {
        method: 'WS',
        path: '/api/identities/:id/events',
        detail:
          'Connect with valid authentication. Events are {type:"email",email:{...}} and {type:"message",message:{...}}. Send the string ping to receive pong. Fetch mailbox/conversations after reconnecting to recover missed events.',
      },
    ],
  },
  {
    id: 'vault-messaging-wallets',
    title: 'Vault, messaging and wallets',
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
      {
        method: 'GET',
        path: '/api/identities/:id/wallet',
        detail:
          'Returns independent coin states, prices, and fees. Unavailable balances are null with status=Unavailable and an error. Missing price/fee entries remain unavailable; receiving public addresses does not require them. BTC/LTC status=Incomplete indicates a bounded scan; nextIndex=null prohibits generating another undiscoverable address.',
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
          'Look up a previous ETH or USDT broadcast using its exact hash and sender nonce. status=consumed means the sender nonce advanced, seen means the hash is known, unknown retains uncertainty. Unknown sends can be retried using the same signed bytes.',
        request: {address: '0x1111111111111111111111111111111111111111', txid: '0x' + 'a'.repeat(64), nonce: 2},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/wallet/recovery',
        detail:
          'Explicitly scan up to 1200 BTC/LTC addresses to find funds beyond the normal gap. Recovered funds can be spent with an existing owned change address; receiving new addresses stays bounded.',
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
    id: 'billing-extension-operations',
    title: 'Billing, extension and operations',
    endpoints: [
      {
        method: 'POST',
        path: '/api/billing/checkout',
        detail:
          'Plan is monthly, annually or lifetime. Stable requestID identifies one purchase. Returns step confirm with saved-card details, or create/auth/finish with clientSecret, identityID and providerID. Card data belongs in Stripe Elements; this route does not accept a payment field.',
        request: {plan: 'monthly', requestID: 'a879a094-8396-42fc-9e46-73eebfaf1de5'},
        response: {step: 'confirm', cardName: 'Visa', last4: '4242', identityID: 'a11ce0000001'},
      },
      {
        method: 'POST',
        path: '/api/billing/checkout/confirm',
        detail:
          'Confirm using the saved card and the same plan/requestID. A create step requires Stripe Elements; auth requires Stripe authentication; finish means Stripe reported success. Identity creation is completed by the verified payment webhook.',
        request: {plan: 'monthly', requestID: 'a879a094-8396-42fc-9e46-73eebfaf1de5'},
        response: {
          step: 'create',
          clientSecret: '<Stripe client secret>',
          identityID: 'a11ce0000001',
          providerID: 'pi_<payment intent>',
        },
      },
      {
        method: 'POST',
        path: '/api/billing/crypto/invoices',
        detail: '{plan,swapCoin,requestID,refundAddress?}',
        request: {plan: 'monthly', requestID: 'a879a094-8396-42fc-9e46-73eebfaf1de5', swapCoin: 'xmr'},
        response: {
          invoiceID: '<invoice UUID>',
          depositAddress: '<deposit address>',
          depositAmount: '0.123456',
          coin: 'xmr',
        },
      },
      {
        method: 'POST',
        path: '/api/billing/crypto/renewals',
        detail:
          'Renew an owned identity using its existing plan. Optional refundAddress is for the selected swapCoin. Stable requestID identifies one renewal.',
        request: {
          plan: 'monthly',
          requestID: 'a879a094-8396-42fc-9e46-73eebfaf1de5',
          swapCoin: 'xmr',
          identityID: 'a11ce0000001',
        },
        response: {
          invoiceID: '<invoice UUID>',
          depositAddress: '<deposit address>',
          depositAmount: '0.123456',
          coin: 'xmr',
        },
      },
      {
        method: 'GET',
        path: '/api/billing/crypto/requests/:id',
        detail:
          'Recover the persisted invoice ID for the same payment request UUID after an interrupted response. Inspect that invoice instead of issuing another purchase.',
      },
      {
        method: 'GET',
        path: '/api/billing/crypto/invoices/:id',
        detail:
          'Returns original deposit details, including a required depositMemo when supplied, plus invoiceID, status, identityID, createdAt, expiresAt, and remainingAmount. Timestamps are ISO strings; remainingAmount is the remaining XMR amount. Status is pending, confirming, paid, underpaid, expired, late, reconciliation, or refunded. A late payment needs reconciliation and does not activate the identity automatically. A paid renewal returns its existing identityID.',
      },
      {
        method: 'WS',
        path: '/api/billing/crypto/invoices/:id/events',
        detail: 'Invoice state updates',
        response: {status: 'pending', identityID: null},
      },
      {
        method: 'GET',
        path: '/api/extension',
        detail: "{username,identities,network:{status:'unavailable',reason}}",
        response: {
          username: 'Theo',
          identities: [],
          network: {status: 'unavailable', reason: 'A network provider has not been configured'},
        },
      },
      {
        method: 'GET',
        path: '/api/auth/test',
        detail: '{authenticated:true}',
        response: {authenticated: true},
      },
      {
        method: 'POST',
        path: '/api/contact',
        detail:
          'Public endpoint. category is question, feedback, collaboration, refund, bug, help, or other. Subject is 1 to 120 characters and message is 1 to 10000. Optional email receives replies.',
        request: {
          category: 'question',
          subject: 'Email service availability',
          message: 'Which email services are currently available?',
          email: 'theo@example.com',
        },
        response: {message: '<delivery confirmation>'},
      },
    ],
  },
];
