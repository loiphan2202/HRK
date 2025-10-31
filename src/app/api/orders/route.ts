import { OrderController } from '@/server/controllers/order-controller';

const controller = new OrderController();

export async function GET(request: Request) {
  return controller.getAll(request);
}

export async function POST(request: Request) {
  return controller.create(request);
}