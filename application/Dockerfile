FROM nginx:alpine

ENV CERTS /certs/*

WORKDIR /etc/nginx 

COPY nginx.conf .

COPY $CERTS .

EXPOSE 80 
