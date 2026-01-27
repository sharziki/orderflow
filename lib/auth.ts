import { hash, compare } from 'bcryptjs'
import { sign, verify } from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'orderflow-secret-change-in-production'
const SALT_ROUNDS = 12

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

// JWT utilities
export interface JWTPayload {
  userId: string
  tenantId: string
  email: string
  role: string
}

export function createToken(payload: JWTPayload): string {
  return sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

// Session management
export async function createSession(userId: string): Promise<string> {
  const token = createToken({ userId, tenantId: '', email: '', role: '' })
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })
  
  return token
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  
  if (!token) return null
  
  const payload = verifyToken(token)
  if (!payload) return null
  
  // Verify session exists in DB
  const session = await prisma.session.findUnique({
    where: { token },
  })
  
  if (!session || session.expiresAt < new Date()) {
    return null
  }
  
  return payload
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null
  
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { tenant: true },
  })
  
  return user
}

export async function getCurrentTenant() {
  const user = await getCurrentUser()
  return user?.tenant || null
}

// Logout
export async function destroySession(token: string) {
  await prisma.session.delete({
    where: { token },
  }).catch(() => {}) // Ignore if not found
}

// Generate order number
export async function generateOrderNumber(tenantId: string): Promise<string> {
  const today = new Date()
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '')
  
  const count = await prisma.order.count({
    where: {
      tenantId,
      createdAt: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
      },
    },
  })
  
  return `ORD-${datePrefix}-${String(count + 1).padStart(4, '0')}`
}

// Generate gift card code
export function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
