import { Product } from '@/generated/prisma/client';
import { ProductRepository } from '../repositories/product-repository';
import { ProductCreate, ProductUpdate } from '../schemas/product-schema';
import { NotFoundError, BadRequestError } from '../errors/base-error';

export class ProductService {
  private readonly repository: ProductRepository;

  constructor() {
    this.repository = new ProductRepository();
  }

  async findById(id: string): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  async findAll(): Promise<Product[]> {
    return await this.repository.findAll();
  }

  async create(data: ProductCreate): Promise<Product> {
    if (data.stock < 0) {
      throw new BadRequestError('Stock cannot be negative');
    }
    if (data.price <= 0) {
      throw new BadRequestError('Price must be positive');
    }
    return await this.repository.create(data);
  }

  async update(id: string, data: ProductUpdate): Promise<Product> {
    await this.findById(id); // Check if product exists

    if (data.stock !== undefined && data.stock < 0) {
      throw new BadRequestError('Stock cannot be negative');
    }
    if (data.price !== undefined && data.price <= 0) {
      throw new BadRequestError('Price must be positive');
    }

    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<Product> {
    await this.findById(id); // Check if product exists
    return await this.repository.delete(id);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findById(id);
    if (product.stock < quantity) {
      throw new BadRequestError('Insufficient stock');
    }
    return await this.repository.updateStock(id, quantity);
  }
}