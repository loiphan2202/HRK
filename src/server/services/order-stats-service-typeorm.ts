import { getDataSource } from '@/lib/typeorm';
import { Order } from '@/entities/Order';
import { OrderProduct } from '@/entities/OrderProduct';
import { Product } from '@/entities/Product';

export interface OrderStats {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  topProducts: Array<{
    productId: string
    productName: string
    quantity: number
    revenue: number
  }>
}

export interface OrderStatsParams {
  startDate?: Date
  endDate?: Date
  period?: 'week' | 'month' | 'year'
}

export class OrderStatsServiceTypeORM {
  private getDateRange(period?: 'week' | 'month' | 'year'): { startDate: Date; endDate: Date } {
    const now = new Date()
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
        break
      default:
        // All time
        startDate = new Date(0)
        break
    }

    return { startDate, endDate }
  }

  async getStats(params?: OrderStatsParams): Promise<OrderStats> {
    const { startDate, endDate } = params?.startDate && params?.endDate
      ? { startDate: params.startDate, endDate: params.endDate }
      : this.getDateRange(params?.period)

    const dataSource = await getDataSource();
    const orderRepo = dataSource.getRepository(Order);
    const orderProductRepo = dataSource.getRepository(OrderProduct);
    const productRepo = dataSource.getRepository(Product);

    // Get all orders (TypeORM MongoDB doesn't support complex date queries like Prisma)
    const allOrders = await orderRepo.find();

    // Filter orders by date range and status
    const orders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate && order.status !== 'CANCELLED';
    });

    // Get all order products for these orders
    // TypeORM MongoDB doesn't support $in directly, so we'll load all and filter
    const orderIds = orders.map(o => o.id.toString());
    const allOrderProducts = await orderProductRepo.find();
    const orderIdSet = new Set(orderIds);
    const relevantOrderProducts = allOrderProducts.filter(
      op => orderIdSet.has(op.orderId.toString())
    );

    // Load products
    const productIds = relevantOrderProducts.map(op => op.productId.toString());
    const allProducts = await productRepo.find();
    const productIdSet = new Set(productIds);
    const products = allProducts.filter(p => productIdSet.has(p.id.toString()));

    const productMap = new Map<string, Product>();
    products.forEach(p => productMap.set(p.id.toString(), p));

    // Build orders with products
    const ordersWithProducts = orders.map(order => {
      const orderProducts = relevantOrderProducts.filter(op => op.orderId.toString() === order.id.toString());
      return {
        ...order,
        products: orderProducts.map(op => ({
          ...op,
          product: productMap.get(op.productId.toString()),
        })).filter(op => op.product),
      };
    });

    // Calculate totals
    const totalRevenue = ordersWithProducts.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = ordersWithProducts.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate top products
    const productStatsMap = new Map<string, { name: string; quantity: number; revenue: number }>()

    for (const order of ordersWithProducts) {
      for (const orderProduct of order.products) {
        const product = orderProduct.product
        if (!product) continue;
        const productId = product.id.toString()
        const existing = productStatsMap.get(productId) || { name: product.name, quantity: 0, revenue: 0 }

        existing.quantity += orderProduct.quantity
        existing.revenue += product.price * orderProduct.quantity
        productStatsMap.set(productId, existing)
      }
    }

    // Convert to array and sort by quantity
    const topProducts = Array.from(productStatsMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10) // Top 10

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topProducts,
    }
  }
}
