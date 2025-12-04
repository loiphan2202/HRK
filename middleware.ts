import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin routes that need protection
  const isAdminRoute = pathname.startsWith('/admin')

  if (isAdminRoute) {
    // Get token from cookie or Authorization header
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verify JWT token
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { userId: string; role?: string }

      // Check if user is admin
      if (decoded.role !== 'ADMIN') {
        // Not admin, redirect to home
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Token is valid and user is admin, continue to route
      return NextResponse.next()
    } catch (error) {
      // Token is invalid or expired, redirect to login
      console.error('Token verification failed in middleware:', error)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      // Clear invalid token cookie
      response.cookies.delete('auth-token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}

