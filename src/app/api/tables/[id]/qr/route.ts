import { TableController } from '@/server/controllers/table-controller';
import { requireAdmin } from '@/server/middleware/auth';

const controller = new TableController();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Require admin authentication
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }
  
  const { id } = await params;
  return controller.generateQrCode(request, id);
}

