import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserServiceTypeORM } from '../services/user-service-typeorm';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

/**
 * Verify JWT token from Authorization header
 */
export async function verifyToken(request: Request): Promise<{ userId: string; user?: any } | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: string };

    // Verify user still exists
    const userService = new UserServiceTypeORM();
    const user = await userService.findById(decoded.userId);
    
    if (!user) {
      return null;
    }

    return {
      userId: decoded.userId,
      user: {
        id: typeof user.id === 'string' ? user.id : user.id.toString(),
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    // Token is invalid or expired
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(request: Request): Promise<NextResponse | null> {
  const authResult = await verifyToken(request);
  
  if (!authResult) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Please login first.' },
      { status: 401 }
    );
  }

  // Attach user info to request (for use in route handlers)
  (request as AuthRequest).userId = authResult.userId;
  (request as AuthRequest).user = authResult.user;

  return null; // Continue to route handler
}

/**
 * Middleware to require admin role
 */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  // First check authentication
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
  }

  const authRequest = request as AuthRequest;
  
  if (authRequest.user?.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Forbidden. Admin access required.' },
      { status: 403 }
    );
  }

  return null; // Continue to route handler
}

