FROM oven/bun:latest

ENV STRIPE_PUBLISHABLE_KEY ""

WORKDIR /app

COPY package.json .

RUN bun install

COPY . .

RUN bun run build

EXPOSE 5000

CMD [ "bun", "run", "start" ]
