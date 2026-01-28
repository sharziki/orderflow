import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'orderflow-secret-change-in-production'
)

// Check if user is authenticated for protected routes
async function checkAuth(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return false
  
  try {
    await jwtVerify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

// CSRF Protection: Check Origin header for mutations
function checkCsrf(request: NextRequest): NextResponse | null {
  const method = request.method
  
  // Only check mutations (POST, PUT, DELETE, PATCH)
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null
  }
  
  const path = request.nextUrl.pathname
  
  // Skip CSRF check for webhook endpoints (they use signature verification)
  if (
    path.startsWith('/api/webhooks/') ||
    path === '/api/doordash/webhook'
  ) {
    return null
  }
  
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  
  // If no Origin header (same-origin requests from some browsers), allow
  if (!origin) {
    return null
  }
  
  try {
    const originUrl = new URL(origin)
    const hostParts = host?.split(':')[0] || ''
    
    // Allow same origin
    if (originUrl.hostname === hostParts) {
      return null
    }
    
    // Allow localhost variations for development
    const localhostVariants = ['localhost', '127.0.0.1']
    if (localhostVariants.includes(originUrl.hostname) && localhostVariants.includes(hostParts)) {
      return null
    }
    
    // Allow orderflow.io domains (including subdomains)
    if (
      originUrl.hostname.endsWith('.orderflow.io') ||
      originUrl.hostname === 'orderflow.io'
    ) {
      const hostIsOrderflow = hostParts.endsWith('.orderflow.io') || hostParts === 'orderflow.io'
      if (hostIsOrderflow) {
        return null
      }
    }
    
    // Allow Vercel preview deployments
    if (
      originUrl.hostname.endsWith('.vercel.app') && 
      (host?.endsWith('.vercel.app') || host?.includes('localhost'))
    ) {
      return null
    }
    
    // Cross-origin request detected - reject
    console.warn(`[CSRF] Blocked cross-origin ${method} from ${origin} to ${host}${path}`)
    return NextResponse.json(
      { error: 'Cross-origin requests not allowed' },
      { status: 403 }
    )
  } catch {
    // Invalid origin header
    console.warn(`[CSRF] Invalid origin header: ${origin}`)
    return NextResponse.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    )
  }
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''
  
  // Get the pathname
  const path = url.pathname
  
  // CSRF check for API mutations
  if (path.startsWith('/api')) {
    const csrfResponse = checkCsrf(request)
    if (csrfResponse) {
      return csrfResponse
    }
    return NextResponse.next()
  }
  
  // Skip for static files and internal Next.js routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.includes('.') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next()
  }
  
  // Protect dashboard routes - redirect to login if not authenticated
  if (path.startsWith('/dashboard')) {
    const isAuthenticated = await checkAuth(request)
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // Main domain paths that shouldn't be treated as store slugs
  const mainPaths = [
    '/dashboard',
    '/admin',
    '/login',
    '/signup',
    '/store',
    '/track',
    '/payment-success',
    '/gift-cards',
    '/forgot-password',
    '/reset-password',
  ]
  
  // Check if this is the main domain
  const mainDomains = [
    'localhost:3000',
    'localhost:3001',
    'localhost:3456',
    'orderflow.io',
    'www.orderflow.io',
    'orderflow-silk.vercel.app',
    process.env.VERCEL_URL,
  ].filter(Boolean)
  
  // Also treat any *.vercel.app as main domain (deployment previews)
  const isVercelPreview = hostname.endsWith('.vercel.app')
  const isMainDomain = isVercelPreview || mainDomains.some(d => hostname.includes(d as string))
  
  // If we're on a subdomain (e.g., joes-pizza.orderflow.io)
  if (!isMainDomain) {
    // Extract subdomain
    const subdomain = hostname.split('.')[0]
    
    // Rewrite to /store/[slug]
    if (subdomain && subdomain !== 'www') {
      // Keep the path, but route through the store
      const newPath = path === '/' ? `/store/${subdomain}` : `/store/${subdomain}${path}`
      return NextResponse.rewrite(new URL(newPath, request.url))
    }
  }
  
  // On main domain, check if path should redirect to store
  // e.g., /joes-pizza -> /store/joes-pizza
  if (isMainDomain) {
    // Don't redirect root path
    if (path === '/') {
      return NextResponse.next()
    }
    
    const firstSegment = path.split('/')[1]
    
    // If it's not a main path, it might be a store slug
    if (firstSegment && !mainPaths.some(p => path.startsWith(p))) {
      // This could be a store slug like /joes-pizza
      // Rewrite to /store/joes-pizza
      const restOfPath = path.split('/').slice(2).join('/')
      const newPath = `/store/${firstSegment}${restOfPath ? '/' + restOfPath : ''}`
      return NextResponse.rewrite(new URL(newPath, request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
