FROM oven/bun:1.4.2


ENV NODE_ENV=prod

WORKDIR /app

COPY package.json ./

RUN bun install

COPY . .

EXPOSE 3000


CMD ["bun", "run", "src/index.ts"]
