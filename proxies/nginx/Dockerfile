FROM nginx:alpine

ARG SUBDOMAIN 'us'

WORKDIR /etc/nginx 

COPY nginx.conf .

RUN sed -i "s|http://localhost|http://server|g" nginx.conf

RUN sed -i "s|\\[TLD\\]|$SUBDOMAIN|g" nginx.conf

COPY .certs/*.pem ./

EXPOSE 80 443
