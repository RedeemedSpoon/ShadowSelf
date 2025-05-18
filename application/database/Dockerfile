FROM postgres:alpine

ENV DB_USERNAME, DB_PASSWORD, DB_NAME

WORKDIR /docker-entrypoint-initdb.d

COPY database/database.sql .

VOLUME [ "/var/lib/postgresql/data" ]
