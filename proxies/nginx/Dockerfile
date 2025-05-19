FROM nginx:alpine

ENV PEM_FILES ''

ARG SUBDOMAINS 'us'

WORKDIR /etc/nginx 

COPY nginx.conf .

RUN sed -i "s|http://localhost|http://server|g" nginx.conf

RUN sed -i "s|[TLD]|$SUBDOMAINS|g" nginx.conf

COPY $PEM_FILES ./

EXPOSE 80 443
