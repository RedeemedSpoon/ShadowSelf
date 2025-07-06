FROM debian:12-slim

RUN apt-get update && apt-get install -y dante-server && rm -rf /var/lib/apt/lists/*

WORKDIR /etc

COPY danted.conf . 

COPY .certs/* ./

EXPOSE 1080

CMD ["danted", "-f", "/etc/danted.conf"]
