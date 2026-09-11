\getenv app_password APP_DB_PASSWORD
\getenv mail_password MAIL_DB_PASSWORD
\getenv database POSTGRES_DB

CREATE ROLE shadowself_app LOGIN PASSWORD :'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE ROLE shadowself_mail LOGIN PASSWORD :'mail_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE :"database" TO shadowself_app, shadowself_mail;
GRANT USAGE ON SCHEMA public TO shadowself_app, shadowself_mail;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO shadowself_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO shadowself_app;
GRANT SELECT ON mailboxes TO shadowself_mail;
