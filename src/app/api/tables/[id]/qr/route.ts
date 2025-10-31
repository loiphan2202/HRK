import { TableController } from '@/server/controllers/table-controller';

const controller = new TableController();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return controller.generateQrCode(request, id);
}

