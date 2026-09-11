-- NOTHING SENSITIVE HERE, THIS IS JUST FOR INITIALIZATION OF THE DATABASE

-- Delete Existing Tables
DROP VIEW IF EXISTS mailboxes;
DROP TABLE IF EXISTS service_mailboxes;
DROP TABLE IF EXISTS fiat_intents;
DROP TABLE IF EXISTS stripe_events;
DROP TABLE IF EXISTS invoice_observations;
DROP TABLE IF EXISTS identity_deletions;
DROP TABLE IF EXISTS creation_jobs;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS wallet_cache;
DROP TABLE IF EXISTS identities;
DROP TABLE IF EXISTS crypto_invoices;
DROP TABLE IF EXISTS users;

-- Create Tables
CREATE TABLE users (
  "id" SERIAL PRIMARY KEY,
  "username" varchar(25) NOT NULL,
  "password" varchar(60) NOT NULL,
  "email" varchar(48) UNIQUE NOT NULL,
  "totp" varchar(32),
  "recovery_hashes" varchar(64)[] NOT NULL DEFAULT '{}',
  "stripe_customer" varchar(18),
  "sessions" varchar(64)[] NOT NULL DEFAULT '{}',
  "api_access" boolean DEFAULT false,
  "api_key" varchar(32)
);

CREATE TABLE crypto_invoices (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner" integer REFERENCES users(id) ON DELETE SET NULL,
  "plan" varchar(8) NOT NULL,
  "xmr_subaddress" varchar(95) UNIQUE,
  "request_id" uuid NOT NULL,
  "swap_coin" text NOT NULL,
  "refund_address" text,
  "provider_state" text,
  "provider_reference" text,
  "response" jsonb,
  UNIQUE (owner, request_id),
  "xmr_amount" numeric(20, 12) NOT NULL,
  "status" varchar(15) DEFAULT 'pending',
  "renewal_id" varchar(12), 
  "creation_date" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE identities (
  "id" varchar(12) PRIMARY KEY,
  "owner" integer NOT NULL REFERENCES users(id),
  "creation_date" timestamp NOT NULL,
  "payment_intent" varchar(27),
  "subscription_id" varchar(28),
  "crypto_invoice" uuid REFERENCES crypto_invoices(id),
  "plan" varchar(8),
  "proxy_server" cidr,
  "proxy_password" varchar(32),
  "location" text,
  "picture" text,
  "name" varchar(30),
  "bio" varchar(126),
  "sex" varchar(6),
  "age" integer,
  "ethnicity" varchar(12),
  "email" varchar(48) UNIQUE,
  "email_password" varchar(33),
  "phone" varchar(15) UNIQUE,
  "phone_sid" varchar(34),
  "wallet_blob" varchar(5503),
  "encryption_version" integer NOT NULL DEFAULT 1,
  "wallet_keys" jsonb, 
  "wallet_funds" numeric(15, 2) DEFAULT 0.00,
  "status" varchar(8) DEFAULT 'inactive'
);

CREATE TABLE accounts (
  "id" SERIAL PRIMARY KEY,
  "owner" varchar(12) NOT NULL REFERENCES identities(id),
  "username" varchar(25) NOT NULL,
  "password" varchar(5503) NOT NULL,
  "website" varchar(48),
  "algorithm" varchar(6),
  "totp" varchar(5503)
);

CREATE TABLE wallet_cache (
  "id" integer PRIMARY KEY DEFAULT 1,
  "keys_data" bytea NOT NULL,
  "cache_data" bytea NOT NULL
);

CREATE TABLE creation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id varchar(12) NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'authorized',
  payload jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE identity_deletions (
  identity_id varchar(12) PRIMARY KEY,
  owner integer NOT NULL,
  email varchar(48),
  billing_done boolean NOT NULL DEFAULT false,
  mail_done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  completed_at timestamptz
);

CREATE TABLE service_mailboxes (
  email varchar(48) PRIMARY KEY,
  password varchar(44) NOT NULL
);

CREATE VIEW mailboxes AS
  SELECT email, encode(sha256(convert_to(email_password, 'UTF8')), 'base64') AS password
  FROM identities WHERE status = 'active' AND email IS NOT NULL
  UNION ALL SELECT email, password FROM service_mailboxes;

CREATE TABLE invoice_observations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES crypto_invoices(id),
  observed_at timestamptz NOT NULL DEFAULT NOW(),
  total numeric(30, 0) NOT NULL,
  unlocked numeric(30, 0) NOT NULL
);

CREATE TABLE stripe_events (
  id text PRIMARY KEY,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT NOW(),
  completed_at timestamptz
);

CREATE TABLE fiat_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  owner integer REFERENCES users(id) ON DELETE SET NULL,
  plan varchar(8) NOT NULL,
  identity_id varchar(12) NOT NULL UNIQUE,
  provider_id text,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (owner, request_id)
);
