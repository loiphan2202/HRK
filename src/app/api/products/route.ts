import { ProductController } from '@/server/controllers/product-controller';
import { requireAdmin } from '@/server/middleware/auth';

const controller = new ProductController();

export async function GET() {
  return controller.getAll();
}

export async function POST(request: Request) {
  // Require admin authentication
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }
  
  return controller.create(request);
}