import { OrderController } from '@/server/controllers/order-controller';
import { requireAdmin } from '@/server/middleware/auth';

const controller = new OrderController();

export async function GET(request: Request) {
  // Require admin authentication to view all orders
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }
  
  return controller.getAll(request);
}

export async function POST(request: Request) {
  // Allow public access to create orders (customers can place orders)
  return controller.create(request);
}