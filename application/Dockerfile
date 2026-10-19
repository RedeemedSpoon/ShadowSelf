FROM nginx:alpine

COPY nginx-entrypoint.sh /usr/local/bin/shadowself-nginx

RUN chmod +x /usr/local/bin/shadowself-nginx

EXPOSE 80 443 8080

ENTRYPOINT ["/usr/local/bin/shadowself-nginx"]
