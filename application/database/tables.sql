-- NOTHING SENSITIVE HERE, THIS IS JUST FOR INITIALIZATION OF THE DATABASE

-- Delete Existing Tables
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS identities;
DROP TABLE IF EXISTS accounts;

-- Create Tables
CREATE TABLE users (
  "id" SERIAL PRIMARY KEY,
  "username" varchar(25) NOT NULL,
  "password" varchar(60) NOT NULL,
  "email" varchar(48) UNIQUE NOT NULL,
  "totp" varchar(32),
  "recovery" varchar(9)[],
  "stripe_customer" varchar(18),
  "revoke_session" varchar(8)[],
  "api_access" boolean DEFAULT false,
  "api_key" varchar(32)
);

CREATE TABLE identities (
  "id" varchar(12) PRIMARY KEY,
  "owner" integer NOT NULL REFERENCES users(id),
  "creation_date" timestamp NOT NULL,
  "payment_intent" varchar(27),
  "subscription_id" varchar(28),
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
  "email" varchar(48),
  "email_password" varchar(33),
  "phone" varchar(15),
  "wallet_blob" varchar(512),
  "wallet_keys" jsonb, 
  "status" varchar(8) DEFAULT 'inactive'
);

CREATE TABLE accounts (
  "id" SERIAL PRIMARY KEY,
  "owner" varchar(12) NOT NULL REFERENCES identities(id),
  "username" varchar(25) NOT NULL,
  "password" varchar(126) NOT NULL,
  "website" varchar(48),
  "algorithm" varchar(6),
  "totp" varchar(126)
);
