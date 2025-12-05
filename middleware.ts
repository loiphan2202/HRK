import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

// Helper functions to reduce cognitive complexity
function isExcludedRoute(pathname: string): boolean {
  const excludedRoutes = [
    '/login',
    '/register',
    '/api',
    '/_next',
    '/favicon.ico',
    '/sitemap.xml',
    '/robots.txt',
  ]
  return excludedRoutes.some((route) => pathname.startsWith(route))
}

function getToken(request: NextRequest): string | null {
  return request.cookies.get('auth-token')?.value || 
         request.headers.get('authorization')?.replace('Bearer ', '') || 
         null
}

function verifyToken(token: string): { userId: string; role?: string } | null {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: string; role?: string }
  } catch (error) {
    console.error('Token verification failed in middleware:', error)
    return null
  }
}

function handleAdminRouteAccess(isAdmin: boolean, request: NextRequest): NextResponse {
  if (!isAdmin) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  return NextResponse.next()
}

function handleNonAdminRouteAccess(isAdmin: boolean, request: NextRequest): NextResponse {
  if (isAdmin) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }
  return NextResponse.next()
}

function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('redirect', pathname)
  return NextResponse.redirect(loginUrl)
}

function handleInvalidTokenForAdminRoute(request: NextRequest, pathname: string): NextResponse {
  const response = redirectToLogin(request, pathname)
  response.cookies.delete('auth-token')
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isExcluded = isExcludedRoute(pathname)
  const isAdminRoute = pathname.startsWith('/admin')
  const token = getToken(request)

  // Handle excluded routes
  if (isExcluded) {
    return NextResponse.next()
  }

  // Handle admin route access
  if (isAdminRoute) {
    if (!token) {
      return redirectToLogin(request, pathname)
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return handleInvalidTokenForAdminRoute(request, pathname)
    }

    return handleAdminRouteAccess(decoded.role === 'ADMIN', request)
  }

  // Handle non-admin route access
  if (token) {
    const decoded = verifyToken(token)
    if (decoded) {
      return handleNonAdminRouteAccess(decoded.role === 'ADMIN', request)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

