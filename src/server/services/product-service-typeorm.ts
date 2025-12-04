import { Product } from '@/entities/Product';
import { ProductRepositoryTypeORM } from '../repositories/product-repository-typeorm';
import { ProductCreate, ProductUpdate } from '../schemas/product-schema';
import { NotFoundError, BadRequestError } from '../errors/base-error';
import { getDataSource } from '@/lib/typeorm';
import { OrderProduct } from '@/entities/OrderProduct';
import { ObjectId } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';

export class ProductServiceTypeORM {
  private readonly repository: ProductRepositoryTypeORM;

  constructor() {
    this.repository = new ProductRepositoryTypeORM();
  }

  async findById(id: string): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product as any;
  }

  async findAll(): Promise<Product[]> {
    return await this.repository.findAll();
  }

  async create(data: ProductCreate): Promise<Product> {
    // Cho phép stock = -1 (unlimited) hoặc null (không theo dõi stock)
    if (data.stock !== undefined && data.stock !== null && data.stock < -1) {
      throw new BadRequestError('Stock cannot be less than -1 (use -1 for unlimited)');
    }
    if (data.price <= 0) {
      throw new BadRequestError('Price must be positive');
    }
    
    return await this.repository.create(data);
  }

  async update(id: string, data: ProductUpdate): Promise<Product> {
    await this.findById(id); // Check if product exists

    // Cho phép stock = -1 (unlimited) hoặc null (không theo dõi stock)
    if (data.stock !== undefined && data.stock !== null && data.stock < -1) {
      throw new BadRequestError('Stock cannot be less than -1 (use -1 for unlimited)');
    }
    if (data.price !== undefined && data.price <= 0) {
      throw new BadRequestError('Price must be positive');
    }
    
    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<Product> {
    const product = await this.findById(id) as any;
    
    const dataSource = await getDataSource();
    const orderProductRepo = dataSource.getRepository(OrderProduct);
    const objectId = new ObjectId(id);

    // Delete related order products
    await orderProductRepo.delete({ productId: objectId } as any);
    
    // Delete image file if exists
    if (product.image) {
      try {
        const imagePath = path.join(process.cwd(), 'public', product.image);
        if (fs.existsSync(imagePath)) {
          await fs.promises.unlink(imagePath);
        }
      } catch (error) {
        console.error('Failed to delete product image:', error);
        // Continue with product deletion even if image deletion fails
      }
    }
    
    // Delete product (ProductCategory will be deleted automatically)
    return await this.repository.delete(id);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findById(id) as any;
    // Chỉ kiểm tra stock nếu product có stock tracking (stock !== null && stock >= 0)
    if (product.stock !== null && product.stock >= 0 && product.stock < quantity) {
      throw new BadRequestError('Insufficient stock');
    }
    // Nếu stock = -1 (unlimited) hoặc null, cho phép update
    return await this.repository.updateStock(id, quantity);
  }
}
