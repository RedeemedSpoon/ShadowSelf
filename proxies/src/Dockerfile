FROM oven/bun:1.4.2

WORKDIR /app

COPY package.json ./

RUN bun install

COPY tsconfig.json index.ts ./

EXPOSE 4000  

VOLUME [ "/var/lib/shadowself/proxy-auth" ]

CMD [ "bun", "run", "start" ]
