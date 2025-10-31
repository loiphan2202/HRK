import { OrderController } from '@/server/controllers/order-controller';

const controller = new OrderController();

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return controller.getByUserId(request, userId);
}