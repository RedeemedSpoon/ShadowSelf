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
DROP TABLE IF EXISTS "users";
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "username" varchar(25) UNIQUE NOT NULL
  "password" varchar(96) NOT NULL
  "picture" bytea NOT NULL
  "api_key" varchar(96)
  "totp" varchar(32)
  "backups" text[]
  "credit_card" varchar(64)
  "crypto_wallet" varchar(64)
  -- other options
);
