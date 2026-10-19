FROM certbot/certbot

COPY certbot-entrypoint.sh /certbot-entrypoint.sh

RUN chmod +x /certbot-entrypoint.sh

ENTRYPOINT ["/certbot-entrypoint.sh"]
