FROM nginx:alpine

ENV PEM_FILES ''

WORKDIR /etc/nginx 

COPY nginx.conf .

COPY $PEM_FILES ./

EXPOSE 80 443
