FROM oven/bun:latest

ENV STRIPE_PUBLISHABLE_KEY ""

WORKDIR /app

COPY frontend/ .

RUN bun install

RUN bun run build

EXPOSE 5000

CMD [ "bun", "run", "start" ]
