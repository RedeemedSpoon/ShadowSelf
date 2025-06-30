FROM alpine:latest

RUN apk add --no-cache squid openrc apache2-utils

WORKDIR /etc/squid

COPY squid.conf .

COPY .certs/* ./

RUN squid -z

EXPOSE 3128

VOLUME [ "/etc/squid/passwd" ]

RUN rm /var/run/squid.pid

CMD ["squid", "-N"]
