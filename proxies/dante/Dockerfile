FROM alpine:latest

RUN apk add --no-cache dante-server

RUN addgroup -S dante && adduser -S -G dante -h /tmp -s /sbin/nologin dante

WORKDIR /etc

COPY danted.conf . 

RUN chown root:dante danted.conf && chmod 640 danted.conf

EXPOSE 1080

VOLUME [ "/etc/passwd" ]

VOLUME [ "/etc/shadow" ]

CMD ["danted", "-N"]
