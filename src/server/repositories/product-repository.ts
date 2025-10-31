import { Product } from '@/generated/prisma/client';
import { BaseRepository, PrismaModelDelegate } from './base-repository';
import { ProductCreate, ProductUpdate } from '../schemas/product-schema';

export class ProductRepository extends BaseRepository<Product, ProductCreate, ProductUpdate> {
  protected getDelegate(): PrismaModelDelegate<Product, ProductCreate, ProductUpdate> {
    return {
      findUnique: (args) => this.prisma.product.findUnique(args),
      findMany: (args) => this.prisma.product.findMany(args),
      create: (args) => this.prisma.product.create(args),
      update: (args) => this.prisma.product.update(args),
      delete: (args) => this.prisma.product.delete(args),
    };
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    return await this.prisma.product.update({
      where: { id },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });
  }
}