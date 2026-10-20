-- NOTHING SENSITIVE HERE, THIS IS JUST FOR INITIALIZATION OF THE DATABASE

-- Delete Existing Tables
DROP VIEW IF EXISTS mailboxes;
DROP VIEW IF EXISTS mailbox_owners;
DROP TABLE IF EXISTS service_mailboxes;
DROP TABLE IF EXISTS fiat_intents;
DROP TABLE IF EXISTS stripe_events;
DROP TABLE IF EXISTS stripe_cleanup;
DROP TABLE IF EXISTS crypto_refunds;
DROP TABLE IF EXISTS wallet_addresses;
DROP TABLE IF EXISTS invoice_transfers;
DROP TABLE IF EXISTS invoice_observations;
DROP TABLE IF EXISTS creation_jobs;
DROP TABLE IF EXISTS mail_submissions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS wallet_cache;
DROP TABLE IF EXISTS identities;
DROP TABLE IF EXISTS crypto_invoices;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS wallet_swaps;
DROP TABLE IF EXISTS users;

-- Create Tables
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username varchar(25) NOT NULL,
  password text NOT NULL,
  email varchar(254) UNIQUE NOT NULL,
  totp text,
  totp_counter bigint,
  recovery_hashes varchar(64)[] NOT NULL DEFAULT '{}',
  stripe_customer text,
  api_access boolean DEFAULT false,
  api_key varchar(64) UNIQUE
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash varchar(64) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_owner_idx ON sessions(owner);

CREATE TABLE wallet_swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  identity_id varchar(12) NOT NULL,
  request jsonb NOT NULL,
  response jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(owner, request_id)
);

CREATE TABLE crypto_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner integer REFERENCES users(id) ON DELETE SET NULL,
  plan varchar(8) NOT NULL,
  xmr_subaddress varchar(95) UNIQUE,
  request_id uuid NOT NULL,
  swap_coin text NOT NULL,
  refund_address text,
  provider_state text,
  provider_reference text,
  response jsonb,
  UNIQUE (owner, request_id),
  xmr_amount numeric(20, 12) NOT NULL,
  status varchar(15) DEFAULT 'pending',
  identity_id varchar(12),
  renewal boolean NOT NULL DEFAULT false,
  usd_amount numeric(12, 4) NOT NULL,
  paid_at timestamptz,
  entitlement_start timestamptz,
  creation_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE identities (
  id varchar(12) PRIMARY KEY,
  owner integer NOT NULL REFERENCES users(id),
  creation_date timestamp NOT NULL,
  payment_intent text,
  subscription_id text,
  crypto_invoice uuid REFERENCES crypto_invoices(id),
  plan varchar(8),
  location text,
  picture text,
  name varchar(30),
  bio varchar(126),
  sex varchar(6),
  age integer,
  ethnicity varchar(12),
  email varchar(254) UNIQUE,
  mailbox_password_encrypted text,
  mailbox_password_hash varchar(44),
  phone varchar(16) UNIQUE,
  wallet_blob varchar(5503),
  vault_revision integer NOT NULL DEFAULT 1,
  wallet_keys jsonb,
  status varchar(8) DEFAULT 'inactive'
);

CREATE TABLE wallet_addresses (
  identity_id varchar(12) NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  coin varchar(3) NOT NULL CHECK (coin IN ('btc', 'ltc')),
  request_id uuid NOT NULL,
  branch smallint NOT NULL CHECK (branch IN (0, 1)),
  address_index integer NOT NULL CHECK (address_index >= 0),
  PRIMARY KEY (identity_id, coin, request_id),
  UNIQUE (identity_id, coin, branch, address_index)
);

CREATE TABLE crypto_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL UNIQUE REFERENCES crypto_invoices(id),
  owner integer REFERENCES users(id) ON DELETE SET NULL,
  destination_encrypted text NOT NULL,
  xmr_amount numeric(20, 12),
  metadata_encrypted text,
  tx_hash char(64),
  requested_at timestamptz NOT NULL DEFAULT NOW(),
  retry_at timestamptz NOT NULL DEFAULT NOW(),
  attempts integer NOT NULL DEFAULT 0,
  error_code text
);
CREATE INDEX crypto_refunds_retry_idx ON crypto_refunds(retry_at);

CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  owner varchar(12) NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  username varchar(25) NOT NULL,
  password varchar(5503) NOT NULL,
  website varchar(2048),
  algorithm varchar(6),
  totp varchar(5503)
);

CREATE TABLE mail_submissions (
  identity_id varchar(12) NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  payload_hash char(64) NOT NULL,
  message_id text NOT NULL,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (identity_id, request_id)
);
CREATE INDEX mail_submissions_created_idx ON mail_submissions(identity_id, created_at);

CREATE TABLE wallet_cache (
  id integer PRIMARY KEY DEFAULT 1,
  revision bigint NOT NULL DEFAULT 1,
  keys_data bytea NOT NULL,
  cache_data bytea NOT NULL
);

CREATE TABLE creation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id varchar(12) NOT NULL UNIQUE REFERENCES identities(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'editing',
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE service_mailboxes (
  email varchar(254) PRIMARY KEY,
  password varchar(44) NOT NULL
);

CREATE VIEW mailboxes AS
  SELECT email, mailbox_password_hash AS password
  FROM identities WHERE status = 'active' AND email IS NOT NULL
  UNION ALL SELECT email, password FROM service_mailboxes;

CREATE VIEW mailbox_owners AS
  SELECT email FROM identities WHERE email IS NOT NULL
  UNION ALL SELECT email FROM service_mailboxes;

CREATE TABLE invoice_transfers (
  invoice_id uuid NOT NULL REFERENCES crypto_invoices(id),
  tx_hash char(64) NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (invoice_id, tx_hash)
);

CREATE TABLE invoice_observations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES crypto_invoices(id),
  observed_at timestamptz NOT NULL DEFAULT NOW(),
  total numeric(30, 0) NOT NULL,
  unlocked numeric(30, 0) NOT NULL
);

CREATE TABLE stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  object_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT NOW(),
  completed_at timestamptz
);

CREATE TABLE stripe_cleanup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text NOT NULL,
  checkout_reference text UNIQUE,
  subscription_id text UNIQUE,
  payment_intent text UNIQUE,
  refund_requested boolean NOT NULL DEFAULT false,
  requested_at timestamptz NOT NULL DEFAULT NOW(),
  resume_invoices text[] NOT NULL DEFAULT '{}',
  retry_at timestamptz DEFAULT NOW(),
  attempts integer NOT NULL DEFAULT 0,
  error_code text
);
CREATE INDEX stripe_cleanup_retry_idx ON stripe_cleanup(retry_at);
CREATE UNIQUE INDEX stripe_cleanup_customer_idx ON stripe_cleanup(customer_id)
  WHERE checkout_reference IS NULL AND subscription_id IS NULL AND payment_intent IS NULL;

CREATE TABLE fiat_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  owner integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan varchar(8) NOT NULL,
  identity_id varchar(12) NOT NULL UNIQUE,
  provider_id text,
  subscription_id text,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (owner, request_id)
);

CREATE INDEX identities_owner_creation_idx ON identities(owner, creation_date DESC);
CREATE INDEX accounts_owner_idx ON accounts(owner);
CREATE INDEX invoice_observations_latest_idx ON invoice_observations(invoice_id, id DESC);
CREATE INDEX invoice_observations_payment_idx ON invoice_observations(invoice_id, total, observed_at);
CREATE INDEX crypto_invoices_monitor_idx ON crypto_invoices(id) WHERE status IN ('pending', 'confirming', 'underpaid', 'expired', 'late', 'reconciliation');
CREATE INDEX stripe_events_pending_idx ON stripe_events(id) WHERE completed_at IS NULL;
