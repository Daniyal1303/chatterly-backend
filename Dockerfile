# 1. Build Stage
FROM oven/bun:1.1-debian AS base
WORKDIR /usr/src/app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install

# Copy source and Prisma schema
COPY . .

# Generate Prisma Client (crucial for types)
RUN bunx prisma generate

# Build the NestJS app
RUN bun run build

# 2. Final Production Stage (Lighter)
FROM oven/bun:1.1-slim
WORKDIR /usr/src/app

# Copy only the necessary files from the 'base' stage
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=base /usr/src/app/dist ./dist
COPY --from=base /usr/src/app/package.json ./
COPY --from=base /usr/src/app/prisma ./prisma

# CRITICAL: Copy the custom generated Prisma client!
# Since you used output = "../generated/prisma", it lives here:
COPY --from=base /usr/src/app/generated ./generated

# Match your NestJS port (Internal container port)
EXPOSE 3003

# Start command: Run migrations then start the server
CMD ["sh", "-c", "bunx prisma migrate deploy && bun dist/src/main.js"]