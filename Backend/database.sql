-- NOTHING SENSITIVE HERE, THIS IS JUST FOR INITIALIZATION OF THE DATABASE

-- Create Database
DROP DATABASE IF EXISTS shadowself;
CREATE DATABASE shadowself;
\connect shadowself;

-- Create User
DROP USER IF EXISTS "main";
\set USER_PASSWORD `echo $DB_PASSWORD`
CREATE USER "main" WITH PASSWORD :'USER_PASSWORD';

-- Grant Privileges
GRANT ALL privileges on database "shadowself" to "main";
ALTER DATABASE "shadowself" OWNER TO "main";
ALTER USER "main" SUPERUSER;

-- Create Tables
DROP TABLE IF EXISTS "users";
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL
);
