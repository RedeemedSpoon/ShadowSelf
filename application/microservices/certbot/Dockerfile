FROM certbot/certbot

WORKDIR /

RUN apk add --no-cache docker-cli 

COPY certbot-entrypoint.sh . 

RUN chmod +x certbot-entrypoint.sh

ENTRYPOINT ["/certbot-entrypoint.sh"]
