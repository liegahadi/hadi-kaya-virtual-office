#!/bin/bash
# This script runs after npm/bun install on Vercel
# It switches Prisma schema to PostgreSQL and generates client

if [ "$VERCEL_ENV" != "" ]; then
  echo "Running on Vercel ($VERCEL_ENV) - using PostgreSQL"
  # Replace SQLite with PostgreSQL in schema
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
  sed -i 's|url      = env("DATABASE_URL")|url      = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")|' prisma/schema.prisma
fi

# Generate Prisma client
bun run db:generate
