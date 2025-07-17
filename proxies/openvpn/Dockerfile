FROM alpine:latest

RUN apk add --no-cache openvpn bash

RUN mkdir -p /etc/openvpn/keys

WORKDIR /etc/openvpn/keys

COPY .easy-pki/* ./

RUN chmod 600 server.key ta.key

WORKDIR /etc/openvpn

COPY server.conf .

RUN touch ipp.txt && chown 65534:65534 ipp.txt

EXPOSE 1194/udp

CMD ["openvpn", "--config", "server.conf"]
