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
  "username" varchar(25) NOT NULL,
  "password" varchar(60) NOT NULL,
  "email" varchar(32) UNIQUE NOT NULL,
  "totp" varchar(32),
  "recovery" varchar(9)[],
  "stripe_customer" varchar(18),
  "revoke_session" varchar(8)[],
  "temporary_token" varchar(16),
  "api_access" boolean default false,
  "api_key" varchar(32)
);
