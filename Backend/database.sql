-- NOTHING SENSITIVE HERE, THIS IS JUST FOR INITIALIZATION OF THE DATABASE

-- Environment Variables
\set USER_NAME `echo $DB_USER`
\set USER_PASSWORD `echo $DB_USER_PWD`
\set DATABASE `echo $DB_NAME`

-- Create Database
DROP DATABASE IF EXISTS :DATABASE;
CREATE DATABASE :DATABASE;
\connect :DATABASE;

-- Create User
DROP USER IF EXISTS :USER_NAME;
CREATE USER :"USER_NAME" WITH PASSWORD :'USER_PASSWORD';

-- Grant Privileges
GRANT ALL privileges on database :DATABASE to :USER_NAME;
ALTER DATABASE :DATABASE OWNER TO :USER_NAME;
ALTER USER :USER_NAME SUPERUSER;

-- Create Tables
DROP TABLE IF EXISTS users;
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

DROP TABLE IF EXISTS identities;
CREATE TABLE identities (
  "id" varchar(12) PRIMARY KEY,
  "owner" integer NOT NULL REFERENCES users(id),
  "creation_date" timestamp NOT NULL,
  "payment_intent" varchar(27),
  "subscription_id" varchar(28),
  "plan" varchar(8),
  "proxy_server" cidr,
  "user_agent" varchar(7),
  "location" text,
  "picture" text,
  "name" varchar(30),
  "bio" varchar(126),
  "age" integer,
  "sex" varchar(6),
  "ethnicity" varchar(12),
  "email" varchar(48),
  "email_password" varchar(33),
  "phone" varchar(12),
  "card" varchar(16),
  "status" varchar(8) DEFAULT 'inactive'
);

DROP TABLE IF EXISTS accounts;
CREATE TABLE accounts (
  "id" SERIAL PRIMARY KEY,
  "owner" varchar(12) NOT NULL REFERENCES identities(id),
  "username" varchar(25) NOT NULL,
  "password" varchar(60) NOT NULL,
  "totp" varchar(32)
);
