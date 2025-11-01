import { prisma } from '@/lib/prisma';

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

export class OrderStatsService {
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

    // Get all orders in the date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'CANCELLED',
        },
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    })

    // Calculate totals
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate top products
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()

    for (const order of orders) {
      for (const orderProduct of order.products) {
        const product = orderProduct.product
        const productId = product.id
        const existing = productMap.get(productId) || { name: product.name, quantity: 0, revenue: 0 }

        existing.quantity += orderProduct.quantity
        existing.revenue += product.price * orderProduct.quantity
        productMap.set(productId, existing)
      }
    }

    // Convert to array and sort by quantity
    const topProducts = Array.from(productMap.entries())
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

