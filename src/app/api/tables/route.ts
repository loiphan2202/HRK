import { TableController } from '@/server/controllers/table-controller';

const controller = new TableController();

export async function GET(request: Request) {
  return controller.getAll(request);
}

export async function POST(request: Request) {
  return controller.create(request);
}

