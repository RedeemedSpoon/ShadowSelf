FROM postgres:alpine

ENV POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB

WORKDIR /docker-entrypoint-initdb.d

COPY database.sql .

VOLUME [ "/var/lib/postgresql/data" ]
