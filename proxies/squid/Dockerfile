FROM alpine:latest

RUN apk add --no-cache squid openrc apache2-utils busybox-initscripts

RUN echo "*/30 * * * * squid -k reconfigure > /dev/stdout 2>&1 || true" > /etc/crontabs/root

WORKDIR /etc/squid

COPY squid.conf .

RUN squid -z

EXPOSE 3128

VOLUME [ "/etc/squid/passwd" ]

CMD crond -b -l 0 -L /dev/null && exec squid -N
