# Use the official Bun image
FROM oven/bun:1.1 as base
WORKDIR /app

# 1. Install dependencies
COPY package.json bun.lockb ./
RUN bun install

# 2. Copy the rest of your code
COPY . .

# 3. Generate Prisma Client
RUN bunx prisma generate

# 4. Build the NestJS app
RUN bun run build

# 5. Final Stage (lighter image)
FROM oven/bun:1.1-slim
WORKDIR /app

# Copy only what we need from the base stage
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./
COPY --from=base /app/prisma ./prisma

# Expose port 3000 for the NestJS app
EXPOSE 3001

# Start command: Run migrations then start the server
CMD ["sh", "-c", "bunx prisma migrate deploy && bun dist/main.js"]