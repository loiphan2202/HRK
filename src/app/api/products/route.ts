import { ProductController } from '@/server/controllers/product-controller';

const controller = new ProductController();

export async function GET(request: Request) {
  return controller.getAll(request);
}

export async function POST(request: Request) {
  return controller.create(request);
}