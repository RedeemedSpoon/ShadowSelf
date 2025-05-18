FROM alpine:latest

ENV CERTS /certs-ovpn/*

RUN apk add --no-cache openvpn

RUN mkdir -p /etc/openvpn/keys /dev/net

RUN mknod /dev/net/tun c 10 200 && chmod 600 /dev/net/tun

WORKDIR /etc/openvpn/keys

COPY $CERTS .

RUN chmod 600 server.key ta.key

WORKDIR /etc/openvpn

COPY server.conf .

RUN touch ipp.txt && chown 65534:65534 ipp.txt

EXPOSE 1194/udp

CMD ["openvpn", "--config", "server.conf"]
