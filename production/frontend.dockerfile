FROM oven/bun:latest

WORKDIR /app

COPY frontend/ .

RUN bun install

RUN bun run build

EXPOSE 5000

CMD [ "bun", "run", "start" ]
