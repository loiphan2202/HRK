import { Order, OrderStatus } from '@/entities/Order';
import { OrderProduct } from '@/entities/OrderProduct';
import { Product } from '@/entities/Product';
import { User } from '@/entities/User';
import { BaseRepositoryTypeORM } from './base-repository-typeorm';
import { OrderCreate, OrderUpdate } from '../schemas/order-schema';
import { ObjectId } from 'mongodb';
import { getDataSource } from '@/lib/typeorm';
import { FindOptionsWhere } from 'typeorm';

type OrderCreateInput = OrderCreate & { total?: number; status?: string };

interface OrderProductWithProduct {
  id: ObjectId;
  orderId: ObjectId;
  productId: ObjectId;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image: string | null;
  };
}

interface OrderWithRelations {
  id: ObjectId;
  userId?: ObjectId;
  tableId?: ObjectId;
  tableNumber?: number;
  total: number;
  status: OrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
  user?: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  } | null;
  products?: OrderProductWithProduct[];
  orderProducts?: OrderProductWithProduct[];
}

export class OrderRepositoryTypeORM extends BaseRepositoryTypeORM<Order> {
  protected getEntity(): new () => Order {
    return Order;
  }

  async findByIdWithRelations(id: string | ObjectId): Promise<OrderWithRelations | null> {
    const dataSource = await getDataSource();
    const orderRepo = dataSource.getRepository(Order);
    const orderProductRepo = dataSource.getRepository(OrderProduct);
    const productRepo = dataSource.getRepository(Product);
    const userRepo = dataSource.getRepository(User);

    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const whereClause: FindOptionsWhere<Order> = { _id: objectId } as FindOptionsWhere<Order>;
    const order = await orderRepo.findOne({ where: whereClause });

    if (!order) return null;

    // Load user
    let user: User | null = null;
    if (order.userId) {
      const userWhere: FindOptionsWhere<User> = { _id: order.userId } as FindOptionsWhere<User>;
      user = await userRepo.findOne({ where: userWhere });
    }

    // Load products
    const orderProductWhere: FindOptionsWhere<OrderProduct> = { orderId: objectId } as FindOptionsWhere<OrderProduct>;
    const orderProducts = await orderProductRepo.find({
      where: orderProductWhere,
    });

    const products: OrderProductWithProduct[] = [];
    for (const op of orderProducts) {
      const productWhere: FindOptionsWhere<Product> = { _id: op.productId } as FindOptionsWhere<Product>;
      const product = await productRepo.findOne({ where: productWhere });
      if (product) {
        products.push({
          ...op,
          product: {
            id: product.id.toString(),
            name: product.name,
            description: product.description ?? null,
            price: product.price,
            image: product.image ?? null,
          },
        });
      }
    }

    const result: OrderWithRelations = {
      ...order,
      userId: order.userId ?? undefined,
      tableId: order.tableId ?? undefined,
      tableNumber: order.tableNumber ?? undefined,
      user: user ? {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
      } : null,
      products,
    };
    return result;
  }

  async findAllWithRelations(where?: Record<string, unknown>): Promise<OrderWithRelations[]> {
    const dataSource = await getDataSource();
    const orderRepo = dataSource.getRepository(Order);
    const orderProductRepo = dataSource.getRepository(OrderProduct);
    const productRepo = dataSource.getRepository(Product);
    const userRepo = dataSource.getRepository(User);

    const orders = await orderRepo.find({
      where: where as FindOptionsWhere<Order>,
      order: { createdAt: 'DESC' },
    });

    // Load related data for all orders
    // TypeORM MongoDB doesn't support $in directly, so we'll load all and filter
    const allOrderProducts = await orderProductRepo.find();
    const orderIdSet = new Set(orders.map(o => o.id.toString()));
    const relevantOrderProducts = allOrderProducts.filter(
      op => orderIdSet.has(op.orderId.toString())
    );

    // Group by orderId
    const productsByOrder = new Map<string, OrderProductWithProduct[]>();
    for (const op of relevantOrderProducts) {
      const orderId = op.orderId.toString();
      if (!productsByOrder.has(orderId)) {
        productsByOrder.set(orderId, []);
      }
      const productWhere: FindOptionsWhere<Product> = { _id: op.productId } as FindOptionsWhere<Product>;
      const product = await productRepo.findOne({ where: productWhere });
      if (product) {
        productsByOrder.get(orderId)!.push({
          ...op,
          product: {
            id: product.id.toString(),
            name: product.name,
            description: product.description ?? null,
            price: product.price,
            image: product.image ?? null,
          },
        });
      }
    }

    // Load users
    const userIds = orders.filter(o => o.userId).map(o => o.userId!);
    // TypeORM MongoDB doesn't support $in directly, so we'll load all and filter
    const allUsers = await userRepo.find();
    const userIdSet = new Set(userIds.map(id => id.toString()));
    const users = allUsers.filter(u => userIdSet.has(u.id.toString()));
    const userMap = new Map(users.map(u => [u.id.toString(), u]));

    return orders.map(order => {
      const getUser = () => {
        if (!order.userId) return null;
        const user = userMap.get(order.userId.toString());
        if (!user) return null;
        return {
          id: order.userId.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      };

      const userData = getUser();
      const result: OrderWithRelations = {
        ...order,
        userId: order.userId ?? undefined,
        tableId: order.tableId ?? undefined,
        tableNumber: order.tableNumber ?? undefined,
        user: userData ? {
          id: userData.id,
          email: userData.email,
          name: userData.name ?? undefined,
          image: userData.image ?? undefined,
        } : null,
        products: productsByOrder.get(order.id.toString()) || [],
        orderProducts: productsByOrder.get(order.id.toString()) || [], // Alias for frontend compatibility
      };
      return result;
    });
  }

  // Custom create method with OrderCreateInput signature
  async createOrder(data: OrderCreateInput): Promise<Order> {
    const dataSource = await getDataSource();
    const orderRepo = dataSource.getRepository(Order);
    const orderProductRepo = dataSource.getRepository(OrderProduct);

    // Helper function to safely create ObjectId
    const createObjectId = (id: string | undefined): ObjectId | undefined => {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return undefined;
      }
      // Validate ObjectId format (24 hex characters)
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return undefined;
      }
      try {
        return new ObjectId(id);
      } catch {
        return undefined;
      }
    };

    // Create order
    const order = orderRepo.create({
      userId: createObjectId(data.userId),
      tableId: createObjectId(data.tableId),
      tableNumber: data.tableNumber,
      total: data.total || 0,
      status: data.status || 'PENDING',
    } as Order);

    const saved = await orderRepo.save(order);
    const savedOrder = Array.isArray(saved) ? saved[0] : saved;

    // Create order products
    if (data.products && data.products.length > 0) {
      const orderProductsToSave = data.products.map(product =>
        orderProductRepo.create({
          orderId: savedOrder.id,
          productId: new ObjectId(product.productId),
          quantity: product.quantity,
        } as OrderProduct)
      );
      // Save each product separately to avoid array issues
      for (const orderProduct of orderProductsToSave) {
        await orderProductRepo.save(orderProduct);
      }
    }

    // Load with relations
    const orderId = typeof savedOrder.id === 'string' ? savedOrder.id : savedOrder.id.toString();
    return await this.findByIdWithRelations(orderId) as unknown as Order;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return await this.findAllWithRelations({ userId: new ObjectId(userId) }) as unknown as Order[];
  }

  async update(id: string, data: OrderUpdate): Promise<Order> {
    return await super.update(id, data as Partial<Order>);
  }
}
