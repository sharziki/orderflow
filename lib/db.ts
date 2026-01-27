import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In development without DB, we'll use a mock
const isDev = process.env.NODE_ENV === 'development'
const hasDbUrl = !!process.env.DATABASE_URL

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: isDev ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
