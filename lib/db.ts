import { PrismaClient } from '@prisma/client'

// Global singleton pattern for serverless environments
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const isDev = process.env.NODE_ENV === 'development'

// Lazy initialization to avoid build-time errors when DATABASE_URL isn't set
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: isDev ? ['query', 'error', 'warn'] : ['error'],
  })
}

// For build time, export a proxy that only instantiates when actually used
function getPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // During build, return a dummy that throws on actual use
    // This prevents build-time instantiation errors
    console.warn('[Prisma] DATABASE_URL not set, deferring initialization')
  }
  
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

// Export a getter that lazily initializes
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaClient()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  }
})

// Graceful shutdown helper for non-serverless environments
export async function disconnectPrisma() {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect()
  }
}
