import { AuthRequest, AuthUser } from './auth';

/**
 * Helper to extract user info from request
 * Use this in route handlers after passing through auth middleware
 */
export function getUserFromRequest(request: Request): { userId: string; user: AuthUser } | null {
  const authRequest = request as AuthRequest;
  if (authRequest.userId && authRequest.user) {
    return {
      userId: authRequest.userId,
      user: authRequest.user,
    };
  }
  return null;
}

/**
 * Helper to check if user is admin
 */
export function isAdminFromRequest(request: Request): boolean {
  const authRequest = request as AuthRequest;
  return authRequest.user?.role === 'ADMIN';
}

