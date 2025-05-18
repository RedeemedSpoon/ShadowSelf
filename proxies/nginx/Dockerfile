FROM nginx:alpine

ENV CERTS /certs/*

WORKDIR /etc/nginx 

COPY nginx/nginx.conf .

COPY $CERTS .

EXPOSE 80 
