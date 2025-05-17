FROM oven/bun:latest

WORKDIR /app

COPY backend/ .

RUN bun install

RUN bun run build

RUN chmod +x ./server

EXPOSE 3000

CMD [ "./server" ]
