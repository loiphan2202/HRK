import { CategoryController } from '@/server/controllers/category-controller';

const controller = new CategoryController();

export async function GET(request: Request) {
  return controller.getAll(request);
}

export async function POST(request: Request) {
  return controller.create(request);
}

