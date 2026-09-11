FROM postgres:18.4-alpine

WORKDIR /docker-entrypoint-initdb.d

COPY schemas.sql 10-schema.sql
COPY roles.sql 20-roles.sql

VOLUME [ "/var/lib/postgresql" ]
