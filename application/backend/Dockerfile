FROM oven/bun:1.4.3

ENV NODE_ENV=prod

WORKDIR /app/backend

COPY backend/package.json backend/bun.lock ./

RUN bun install --frozen-lockfile

COPY backend/ ./

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
