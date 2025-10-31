import { TableController } from '@/server/controllers/table-controller';

const controller = new TableController();

export async function POST(request: Request) {
  return controller.checkIn(request);
}

