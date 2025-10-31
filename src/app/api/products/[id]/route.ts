import { ProductController } from '@/server/controllers/product-controller';

const controller = new ProductController();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return controller.getById(request, id);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return controller.update(request, id);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return controller.delete(request, id);
}