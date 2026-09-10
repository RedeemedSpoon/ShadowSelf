FROM oven/bun:1.4.2

ENV SECRET_KEY "secure-key"

WORKDIR /app

COPY package.json ./

RUN bun install

COPY tsconfig.json index.ts ./

EXPOSE 4000  

VOLUME [ "/etc/squid/passwd" ]

CMD [ "bun", "run", "start" ]
