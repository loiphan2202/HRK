import { Order } from '@/entities/Order';
import { OrderRepositoryTypeORM } from '../repositories/order-repository-typeorm';
import { ProductServiceTypeORM } from './product-service-typeorm';
import { TableServiceTypeORM } from './table-service-typeorm';
import { OrderCreate, OrderUpdate } from '../schemas/order-schema';
import { NotFoundError, BadRequestError } from '../errors/base-error';
import { getDataSource } from '@/lib/typeorm';

export class OrderServiceTypeORM {
  private readonly repository: OrderRepositoryTypeORM;
  private readonly productService: ProductServiceTypeORM;
  private readonly tableService: TableServiceTypeORM;

  constructor() {
    this.repository = new OrderRepositoryTypeORM();
    this.productService = new ProductServiceTypeORM();
    this.tableService = new TableServiceTypeORM();
  }

  async findById(id: string): Promise<Order> {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    return order as any;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return await this.repository.findByUserId(userId);
  }

  async findAll(filters?: { tableNumber?: string | number | null; status?: string | null }): Promise<Order[]> {
    const where: Record<string, unknown> = {};
    if (filters?.tableNumber !== undefined && filters?.tableNumber !== null) {
      // Convert to number if it's a string, otherwise use as-is
      where.tableNumber = typeof filters.tableNumber === 'string' ? Number.parseInt(filters.tableNumber) : filters.tableNumber;
    }
    if (filters?.status && filters.status !== undefined) {
      where.status = filters.status;
    }
    return await this.repository.findAll(Object.keys(where).length > 0 ? where : undefined);
  }

  async update(id: string, data: OrderUpdate): Promise<Order> {
    const order = await this.findById(id) as any; // Check if order exists
    
    // Prepare update data - TypeORM UpdateDateColumn tự động cập nhật khi save
    const updateData: OrderUpdate = {
      ...data,
      // Nếu status thay đổi sang COMPLETED hoặc CANCELLED, đảm bảo updatedAt được set
      // TypeORM sẽ tự động cập nhật updatedAt khi entity được save
    };
    
    // If status is being updated to COMPLETED, update table status
    if (data.status === 'COMPLETED' && order.tableId) {
      // Check if there are other pending/processing orders for this table
      const otherOrders = await this.repository.findAll({
        tableNumber: order.tableNumber || undefined,
        status: undefined,
      });
      
      const hasActiveOrders = otherOrders.some(
        (o: any) => o.id.toString() !== order.id.toString() && (o.status === 'PENDING' || o.status === 'PROCESSING')
      );
      
      if (!hasActiveOrders && order.tableId) {
        await this.tableService.updateStatus(order.tableId.toString(), 'AVAILABLE');
      }
    }
    
    // TypeORM UpdateDateColumn sẽ tự động cập nhật updatedAt khi entity được save
    return await this.repository.update(id, updateData);
  }

  private async validateProductsAndCalculateTotal(products: OrderCreate['products']): Promise<number> {
    let total = 0;

    for (const item of products) {
      if (item.quantity <= 0) {
        throw new BadRequestError('Product quantity must be positive');
      }

      const product = await this.productService.findById(item.productId) as any;
      // Chỉ kiểm tra stock nếu product có stock tracking (stock !== null && stock >= 0)
      if (product.stock !== null && product.stock >= 0 && product.stock < item.quantity) {
        throw new BadRequestError(`Insufficient stock for product ${product.name}`);
      }
      total += product.price * item.quantity;
    }

    return total;
  }

  private async validateTableToken(tableToken: string, tableNumber: number): Promise<void> {
    const tableByToken = await this.tableService.findByToken(tableToken);
    if (!tableByToken) {
      throw new BadRequestError('Invalid table token. Please check in using QR code.');
    }
    if (tableByToken.number !== tableNumber) {
      throw new BadRequestError('Table token does not match table number.');
    }
  }

  private async validateTableAvailability(tableNumber: number): Promise<void> {
    const table = await this.tableService.findByNumber(tableNumber);
    if (!table) {
      throw new BadRequestError(`Table ${tableNumber} not found.`);
    }
    if (table.status !== 'AVAILABLE') {
      throw new BadRequestError(`Table ${tableNumber} is not available. Please choose another table.`);
    }
    
    const pendingOrders = await this.repository.findAll({
      tableNumber,
      status: 'PENDING',
    });
    if (pendingOrders.length > 0) {
      throw new BadRequestError('Table is occupied with pending orders');
    }
  }

  private async handleTableLogic(
    data: OrderCreate,
    createPayload: OrderCreate & { total: number }
  ): Promise<void> {
    if (!data.tableNumber) {
      throw new BadRequestError('Table number is required');
    }

    const table = await this.tableService.findByNumber(data.tableNumber);
    if (!table) {
      throw new BadRequestError(`Table ${data.tableNumber} not found.`);
    }

    if (data.tableToken) {
      // Validate token nếu có (cho QR check-in)
      await this.validateTableToken(data.tableToken, data.tableNumber);
      // Nếu có valid token (đã check-in), cho phép đặt món dù bàn không AVAILABLE
      // Không cần kiểm tra pending orders vì đã check-in thì có thể có nhiều orders
    } else {
      // Nếu không có token, kiểm tra bàn có đang trống không
      await this.validateTableAvailability(data.tableNumber);
    }
    
    // Update table to OCCUPIED
    await this.tableService.updateStatus(table.id.toString(), 'OCCUPIED');
    createPayload.tableId = table.id.toString();
  }

  private async updateProductStock(products: OrderCreate['products']): Promise<void> {
    await Promise.all(
      products.map(item =>
        this.productService.updateStock(item.productId, item.quantity)
      )
    );
  }

  async create(data: OrderCreate): Promise<Order> {
    if (!data.products.length) {
      throw new BadRequestError('Order must contain at least one product');
    }

    // Use TypeORM transaction
    const dataSource = await getDataSource();
    return await dataSource.transaction(async (manager) => {
      // Check stock and calculate total
      const total = await this.validateProductsAndCalculateTotal(data.products);

      // Create order (include computed total)
      const createPayload: OrderCreate & { total: number } = {
        ...data,
        total,
      };

      // Handle table status if tableNumber is provided
      await this.handleTableLogic(data, createPayload);

      const order = await this.repository.createOrder(createPayload);

      // Update stock for all products
      await this.updateProductStock(data.products);

      return order;
    });
  }
}
