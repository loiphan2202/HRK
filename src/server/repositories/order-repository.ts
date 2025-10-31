import { Order } from '@/generated/prisma/client';
import { BaseRepository, PrismaModelDelegate } from './base-repository';
import { OrderCreate, OrderUpdate } from '../schemas/order-schema';

type OrderCreateInput = OrderCreate & { total?: number; status?: string };

export class OrderRepository extends BaseRepository<Order, OrderCreateInput, OrderUpdate> {
  protected getDelegate(): PrismaModelDelegate<Order, OrderCreate, OrderUpdate> {
    return {
      findUnique: (args) => this.prisma.order.findUnique({
        ...args,
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      }),
      findMany: (args) => this.prisma.order.findMany({
        ...args,
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      }),
      create: (args) => this.prisma.order.create({
        ...args,
        data: {
          ...args.data,
          userId: args.data.userId || undefined,
          tableId: args.data.tableId || undefined,
          tableNumber: args.data.tableNumber || undefined,
          status: (args.data as any).status || 'PENDING',
          products: {
            create: args.data.products.map(product => ({
              productId: product.productId,
              quantity: product.quantity,
            })),
          },
          total: (args.data as any).total || 0,
        },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      }),
      update: (args) => this.prisma.order.update({
        ...args,
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      }),
      delete: (args) => this.prisma.order.delete({
        ...args,
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      }),
    };
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return await this.getDelegate().findMany({
      where: { userId },
    });
  }

  async findAll(where?: any): Promise<Order[]> {
    return await this.getDelegate().findMany({
      where: where || {},
    });
  }
}