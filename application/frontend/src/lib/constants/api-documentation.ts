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
        detail: 'Sign in with your account password. A second-factor account returns {challenge,expiresIn:300} instead of a token.',
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
        detail: '{email,password} → {signup,email,expiresIn}',
        request: {email: 'theo@example.com', password: 'Example-Account-Password-2026!'},
        response: {signup: '<signup from registration response>', email: 'theo@example.com', expiresIn: 1800},
      },
      {
        method: 'POST',
        path: '/api/auth/registration/email',
        detail: '{signup,access}',
        request: {signup: '<signup from registration response>', access: '12345678'},
        response: {email: 'theo@example.com'},
      },
      {
        method: 'PUT',
        path: '/api/auth/registration/profile',
        detail: '{signup,username}',
        request: {signup: '<signup from registration response>', username: 'Theo'},
        response: {username: 'Theo'},
      },
      {
        method: 'POST',
        path: '/api/auth/registration/totp',
        detail: '{signup,enable} → {secret,uri?}',
        request: {signup: '<signup from registration response>', enable: true},
        response: {secret: '<base32 secret>', uri: 'otpauth://totp/<enrollment URI>'},
      },
      {
        method: 'POST',
        path: '/api/auth/registration/recovery',
        detail: 'Verify the six-digit TOTP code. Returns six recovery codes once; store them before completing registration.',
        request: {signup: '<signup from registration response>', token: '123456'},
        response: {recovery: ['<six one-time recovery codes>']},
      },
      {
        method: 'POST',
        path: '/api/auth/registration/complete',
        detail:
          'Create the account after email and profile verification. payment is an optional Stripe payment-method ID. warning may report an unavailable payment setup after successful account creation.',
        request: {signup: '<signup from registration response>'},
        response: {token: 'ss_session_<session token>'},
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
          sessions: [{id: '2e5463b6-13db-4385-9f39-8d53da0d4d1f', current: true, createdAt: '2026-10-11T00:00:00.000Z', expiresAt: '2027-01-09T00:00:00.000Z'}],
        },
      },
      {
        method: 'DELETE',
        path: '/api/settings/sessions',
        detail: 'Provide id to revoke an owned session. Send {} or no body to revoke all sessions, including the current one.',
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
        request: {currentPassword: 'Example-Account-Password-2026!', secret: '<32-character base32 secret>', token: '123456'},
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
        request: {currentPassword: 'Example-Account-Password-2026!', email: 'new-address@example.com', access: '12345678'},
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
          'Returns {identities:[{id,picture,name,country,location,email,phone,accounts,walletFunds,status,paymentMethod,plan}]}. Profile fields can be null before provisioning. walletFunds is null in the identity summary; use GET /wallet for verified balances; accounts is the vault entry count.',
      },
      {
        method: 'GET',
        path: '/api/identities/:id',
        detail:
          'Returns {id,plan,location,picture,name,bio,age,sex,ethnicity,email,phone,vaultRevision,creationDate,status,walletFunds,walletKeys,walletBlob,paymentMethod}. plan is monthly, annually, or lifetime. walletKeys contains public btc/ltc/evm keys and encrypted xmr keys. Provider credentials are excluded.',
      },
      {
        method: 'PATCH',
        path: '/api/identities/:id/profile',
        detail:
          'Partial profile update. Allowed fields are name, bio, sex, age, ethnicity, and picture. Picture is base64 image data. Returns the saved profile fields.',
        request: {name: 'Theo Mercer', bio: 'A photographer who enjoys hiking.'},
        response: {name: 'Theo Mercer', sex: 'male', age: 31, ethnicity: 'caucasian', bio: 'A photographer who enjoys hiking.', picture: '<base64 image>'},
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
          'Requires the account password. Returns {success:true} when complete, or HTTP 202 with {status:"deleting",message} while provider cleanup retries.',
        request: {currentPassword: 'Example-Account-Password-2026!'},
        response: {success: true},
      },
      {
        method: 'GET',
        path: '/api/identities/:id/creation',
        detail:
          'Returns saved draft, supported locations, identity status, and creationStatus. creationStatus is editing, provisioning, or completed. The draft accepts fields until provisioning reserves resources.',
        response: {
          draft: {
            location: 'US',
            profile: {name: 'Theo Mercer', sex: 'male', age: 31, ethnicity: 'caucasian', bio: 'A photographer who enjoys hiking.', picture: '<base64 image>'},
          },
          locations: [{country: 'United States', code: 'US', city: 'Seattle', localization: 'en_US', map: 'https://osm.org/go/WIXvEZp-'}],
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
          location: 'US',
          profile: {name: 'Theo Mercer', sex: 'male', age: 31, ethnicity: 'caucasian', bio: 'A photographer who enjoys hiking.', picture: '<base64 image>'},
          email: 'theo.mercer@shadowself.io',
          phone: '+12025550142',
        },
        response: {
          draft: {
            location: 'US',
            profile: {name: 'Theo Mercer', sex: 'male', age: 31, ethnicity: 'caucasian', bio: 'A photographer who enjoys hiking.', picture: '<base64 image>'},
            email: 'theo.mercer@shadowself.io',
            phone: '+12025550142',
          },
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/creation/profile',
        detail:
          'Generate and save a profile and portrait. regenerate supplies name, bio, age, sex and ethnicity. repeat requests local name/bio suggestions without generating a portrait.',
        request: {location: 'US', repeat: {name: true, bio: true, sex: 'male'}},
        response: {repeat: {name: 'Theo Mercer', bio: 'A photographer who enjoys hiking.'}},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/creation/email',
        detail: '{profile} → {email} suggested local part',
        request: {
          profile: {name: 'Theo Mercer', sex: 'male', age: 31, ethnicity: 'caucasian', bio: 'A photographer who enjoys hiking.', picture: '<base64 image>'},
        },
        response: {email: 'theomercer'},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/creation/phones',
        detail: '{email,location?} → {phone:[...]}',
        request: {email: 'theomercer@shadowself.io', location: 'US'},
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
        detail: '{accounts,vaultRevision}',
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
        },
      },
      {
        method: 'POST',
        path: '/api/identities/:id/vault/entries',
        detail: '{username,password,website?,totp?,algorithm?,vaultRevision}; password and totp are encrypted values',
        request: {
          username: 'theo_m',
          password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          website: 'https://example.com',
          totp: null,
          vaultRevision: 1,
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
        detail: '{id,username,password,website?,totp?,algorithm?,vaultRevision}',
        request: {
          id: 1,
          username: 'theo_m',
          password: '<v1. followed by base64-encoded IV and AES-GCM ciphertext>',
          website: 'https://example.com',
          totp: null,
          vaultRevision: 2,
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
        detail: '{id,vaultRevision}',
        request: {id: 1, vaultRevision: 3},
        response: {id: 1, vaultRevision: 4},
      },
      {
        method: 'PUT',
        path: '/api/identities/:id/vault/encryption',
        detail:
          'Atomically replace all vault ciphertext, wallet phrase blob, and encrypted Monero keys. accounts must include every current entry exactly once. keys contains only the encrypted Monero fields; public keys stay unchanged.',
        request: {
          vaultRevision: 4,
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
          'Returns {emails:{inbox,sent,drafts,junk,messagesCount,sentMessagesCount,draftsMessagesCount,junkMessagesCount}}. Each mailbox is an array of email records. No query parameters are required.',
        response: {emails: {inbox: [], sent: [], drafts: [], junk: [], messagesCount: 0, sentMessagesCount: 0, draftsMessagesCount: 0, junkMessagesCount: 0}},
      },
      {
        method: 'GET',
        path: '/api/identities/:id/mail/messages/more',
        detail: 'Query {mailbox,since} → {mailbox,since,nextEmails}',
        query: '?mailbox=INBOX&since=42',
        response: {mailbox: 'INBOX', since: '42', nextEmails: []},
      },
      {
        method: 'GET',
        path: '/api/identities/:id/mail/reply',
        detail: 'Fetch by Message-ID. Returns {uuid,fetchEmail}; fetchEmail is an email record or null when the referenced message is missing.',
        query: '?uuid=%3Cmessage%40example.com%3E',
      },
      {
        method: 'POST',
        path: '/api/identities/:id/mail/messages',
        detail:
          'Send email. Optional inReplyTo is a Message-ID, references is a Message-ID array, attachments is [{filename,data}] with base64 data, and draft is the old Drafts UID. Returns {draft?,sentEmail,warning?}. A warning means delivery succeeded but mailbox cleanup failed; do not resend.',
        request: {to: 'recipient@example.com', subject: 'Project update', body: 'The updated photos are ready.', references: [], attachments: []},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/mail/forward',
        detail:
          'Forward a message by UID. Returns {uid,forward,forwardEmail,warning?}. A warning means forwarding succeeded but saving Sent failed; do not repeat delivery.',
        request: {uid: 42, forward: 'recipient@example.com'},
      },
      {
        method: 'PUT',
        path: '/api/identities/:id/mail/draft',
        detail:
          'Save the composer payload in Drafts. Optional draft identifies the previous UID to replace. Returns {draft?,savedDraft,warning?}. When removing the previous draft fails, the new draft remains saved.',
        request: {to: 'recipient@example.com', subject: 'Project update', body: 'The updated photos are ready.', references: [], attachments: []},
      },
      {
        method: 'DELETE',
        path: '/api/identities/:id/mail/messages',
        detail: 'Mailbox must be INBOX, Sent, Drafts, or Junk. Deletion moves a message into Junk; deletion from Junk removes it permanently.',
        request: {mailbox: 'INBOX', uid: 42},
        response: {mailbox: 'INBOX', uid: 42},
      },
      {
        method: 'GET',
        path: '/api/identities/:id/phone/conversations',
        detail: '{messages} latest conversation messages',
        response: {messages: []},
      },
      {
        method: 'GET',
        path: '/api/identities/:id/phone/conversation',
        detail: '{addressee} query → {addressee,conversation}',
        query: '?addressee=%2B12025550142',
        response: {addressee: '+12025550142', conversation: []},
      },
      {
        method: 'POST',
        path: '/api/identities/:id/phone/messages',
        detail:
          'Send an SMS to another E.164 number. Message body supports 4 to 160 characters. Returns {addressee,messageSent}; messageSent is a phone message record.',
        request: {addressee: '+12025550142', body: 'The photos are ready.'},
      },
      {
        method: 'DELETE',
        path: '/api/identities/:id/phone/conversations',
        detail: '{addressee}',
        request: {addressee: '+12025550142'},
        response: {addressee: '+12025550142'},
      },
      {
        method: 'GET',
        path: '/api/identities/:id/wallet',
        detail:
          'Returns {prices,fees,wallet}. prices has btc/ltc/eth/usdt/xmr entries with usdPrice,dailyChange,chart. fees has low,medium,high rates per coin. wallet contains btc/ltc/eth/usdt chain data. Monero balances and history are scanned locally, after GET /wallet/node. Failed or stale provider reads return an error.',
      },
      {
        method: 'GET',
        path: '/api/identities/:id/wallet/node',
        detail: 'Monero node and starting date',
        response: {startingDate: '2026-10-11T00:00:00.000Z', status: 'Network Operational', nodeUrl: 'https://xmr-node.cakewallet.com:18081/json_rpc'},
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
        detail: '{tradeID,coinFrom,coinTo,amount,destinationAddress,refundAddress,provider,isFixed,requestID}; requestID is a UUID',
        request: {
          tradeID: '<tradeID from quote>',
          coinFrom: 'btc',
          coinTo: 'xmr',
          amount: 0.01,
          destinationAddress: '<destination wallet address>',
          refundAddress: '<refund wallet address>',
          provider: '<provider name from quote>',
          isFixed: false,
          requestID: 'a879a094-8396-42fc-9e46-73eebfaf1de5',
        },
        response: {status: 'waiting', depositAddress: '<provider deposit address>', depositAmount: '0.01', externalLink: '<provider tracking URL>'},
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
          'Inspect imported public addresses before client-side sweep signing. BTC/LTC return {utxos,balance,nonce}; balance and output values are satoshis. ETH/USDT also return gasBalance; balance and gasBalance are integer strings in base units. No private keys belong in this request.',
        request: {coin: 'eth', addresses: ['0x0000000000000000000000000000000000000001']},
        response: {utxos: [], balance: '1000000000000000', gasBalance: '1000000000000000', nonce: 1},
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
        response: {step: 'create', clientSecret: '<Stripe client secret>', identityID: 'a11ce0000001', providerID: 'pi_<payment intent>'},
      },
      {
        method: 'POST',
        path: '/api/billing/crypto/invoices',
        detail: '{plan,swapCoin,requestID,refundAddress?}',
        request: {plan: 'monthly', requestID: 'a879a094-8396-42fc-9e46-73eebfaf1de5', swapCoin: 'xmr'},
        response: {invoiceID: '<invoice UUID>', depositAddress: '<deposit address>', depositAmount: '0.123456', coin: 'xmr'},
      },
      {
        method: 'POST',
        path: '/api/billing/crypto/renewals',
        detail:
          'Renew an owned identity using its existing plan. Optional refundAddress is for the selected swapCoin. Stable requestID identifies one renewal.',
        request: {plan: 'monthly', requestID: 'a879a094-8396-42fc-9e46-73eebfaf1de5', swapCoin: 'xmr', identityID: 'a11ce0000001'},
        response: {invoiceID: '<invoice UUID>', depositAddress: '<deposit address>', depositAmount: '0.123456', coin: 'xmr'},
      },
      {
        method: 'GET',
        path: '/api/billing/crypto/invoices/:id',
        detail:
          'Returns original deposit details plus invoiceID, status, identityID, createdAt, expiresAt, and remainingAmount. Timestamps are ISO strings; remainingAmount is the remaining XMR amount. Status is pending, confirming, paid, underpaid, expired, late, or refunded. A late payment needs reconciliation and does not activate the identity automatically. A paid renewal returns its existing identityID.',
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
          network: {status: 'unavailable', reason: 'Network access is unavailable. Self-hosted proxy and VPN services are retired'},
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
