FROM certbot/certbot

WORKDIR /

COPY certbot-entrypoint.sh . 

RUN chmod +x certbot-entrypoint.sh

ENTRYPOINT ["/certbot-entrypoint.sh"]
