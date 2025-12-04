import { ProductController } from '@/server/controllers/product-controller';
import { requireAdmin } from '@/server/middleware/auth';

const controller = new ProductController();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return controller.getById(request, id);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Require admin authentication
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }
  
  const { id } = await params;
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