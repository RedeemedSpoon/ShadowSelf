FROM postgres:18-alpine

ENV POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB

WORKDIR /docker-entrypoint-initdb.d

COPY schemas.sql 01-schemas.sql
COPY roles.sql 02-roles.sql

VOLUME [ "/var/lib/postgresql" ]
