FROM nginx:alpine

ENV PEM_FILES ''

WORKDIR /etc/nginx 

COPY nginx.conf .

RUN sed -i "s|http://localhost|http://frontend|g" nginx.conf

RUN sed -i "s|http://localhost|http://backend|g" nginx.conf

COPY $PEM_FILES ./

EXPOSE 80 443
