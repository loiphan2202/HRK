import { UserController } from '@/server/controllers/user-controller';

const controller = new UserController();

export async function POST(request: Request) {
  return controller.register(request);
}