FROM oven/bun:latest

ENV SECRET_KEY "secure-key"

WORKDIR /app

COPY tsconfig.json package.json index.ts ./

RUN bun install

RUN bun run build

RUN chmod +x ./proxy

EXPOSE 4000  

VOLUME [ "/etc/squid/passwd" ]

VOLUME [ "/etc/passwd" ]

VOLUME [ "/etc/shadow" ]

CMD [ "./proxy" ]
