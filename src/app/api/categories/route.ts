import { CategoryController } from '@/server/controllers/category-controller';

const controller = new CategoryController();

export async function GET() {
  return controller.getAll();
}

export async function POST(request: Request) {
  return controller.create(request);
}

