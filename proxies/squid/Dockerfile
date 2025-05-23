FROM alpine:latest

RUN apk add --no-cache squid openrc apache2-utils

WORKDIR /etc/squid

COPY squid.conf .

RUN squid -z

EXPOSE 3128

VOLUME [ "/etc/squid/passwd" ]

CMD ["squid", "-N"]
