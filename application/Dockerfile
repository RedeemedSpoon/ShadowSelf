FROM nginx:alpine

WORKDIR /etc/nginx 

COPY .certs/*.pem ./

COPY nginx.conf .

RUN sed -i "s|http://localhost:5000|http://frontend:5000|g" nginx.conf

RUN sed -i "s|http://localhost:3000|http://backend:3000|g" nginx.conf

VOLUME [ "/var/www/certbot" ]

EXPOSE 80 443
