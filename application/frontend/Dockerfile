FROM oven/bun:1.4.3

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

EXPOSE 5000

CMD ["bun", "run", "start"]
