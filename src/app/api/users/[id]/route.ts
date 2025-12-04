import { UserController } from '@/server/controllers/user-controller';
import { requireAuth, requireAdmin, getUserFromRequest } from '@/server/middleware/auth';

const controller = new UserController();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return controller.getById(request, id);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Require authentication
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
  }
  
  const { id } = await params;
  const userInfo = getUserFromRequest(request);
  
  // User can only update themselves, or admin can update anyone
  if (userInfo && userInfo.userId !== id && userInfo.user.role !== 'ADMIN') {
    return new Response(
      JSON.stringify({ success: false, error: 'Forbidden. You can only update your own profile.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return controller.update(request, id);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Require admin authentication
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }
  
  const { id } = await params;
  return controller.delete(request, id);
}