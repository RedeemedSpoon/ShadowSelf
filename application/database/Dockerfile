FROM postgres:alpine

WORKDIR /docker-entrypoint-initdb.d

COPY database/database.sql .

VOLUME [ "/var/lib/postgresql/data" ]
