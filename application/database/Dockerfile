FROM postgres:alpine

ENV POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB

WORKDIR /docker-entrypoint-initdb.d

COPY schemas.sql .

VOLUME [ "/var/lib/postgresql/data" ]
