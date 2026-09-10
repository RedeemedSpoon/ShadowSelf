FROM oven/bun:1.4.2

ARG PUBLIC_STRIPE_KEY
ENV PUBLIC_STRIPE_KEY=$PUBLIC_STRIPE_KEY
ENV PUBLIC_NODE_ENV="prod"
ARG PUBLIC_NODE_ENV="prod"

WORKDIR /app

COPY package.json ./

RUN bun install

COPY . .

RUN bun run build

EXPOSE 5000

CMD [ "bun", "run", "start" ]
