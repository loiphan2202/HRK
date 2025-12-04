import { TableController } from '@/server/controllers/table-controller';
import { requireAdmin } from '@/server/middleware/auth';

const controller = new TableController();

export async function GET(request: Request) {
  return controller.getAll(request);
}

export async function POST(request: Request) {
  // Require admin authentication
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }
  
  return controller.create(request);
}

