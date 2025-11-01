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
          user: true,
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
          user: true,
          products: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      create: (args) => this.prisma.order.create({
        ...args,
        data: {
          ...args.data,
          userId: args.data.userId || undefined,
          tableId: args.data.tableId || undefined,
          tableNumber: args.data.tableNumber || undefined,
          status: ('status' in args.data && typeof (args.data as Record<string, unknown>).status === 'string') 
            ? (args.data as Record<string, unknown>).status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
            : 'PENDING',
          products: {
            create: args.data.products.map(product => ({
              productId: product.productId,
              quantity: product.quantity,
            })),
          },
          total: ('total' in args.data && typeof (args.data as Record<string, unknown>).total === 'number') 
            ? (args.data as Record<string, unknown>).total as number 
            : 0,
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

  async findAll(where?: Record<string, unknown>): Promise<Order[]> {
    return await this.getDelegate().findMany({
      where: where || {},
    });
  }
}