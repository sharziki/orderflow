import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''
  
  // Get the pathname
  const path = url.pathname
  
  // Skip for API routes, static files, and internal Next.js routes
  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.includes('.') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next()
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
    process.env.VERCEL_URL,
  ].filter(Boolean)
  
  const isMainDomain = mainDomains.some(d => hostname.includes(d as string))
  
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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
