import { ProductController } from '@/server/controllers/product-controller';

const controller = new ProductController();

export async function GET() {
  return controller.getAll();
}

export async function POST(request: Request) {
  return controller.create(request);
}