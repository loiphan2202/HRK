import { Product } from '@/generated/prisma/client';
import { BaseRepository, PrismaModelDelegate } from './base-repository';
import { ProductCreate, ProductUpdate } from '../schemas/product-schema';

export class ProductRepository extends BaseRepository<Product, ProductCreate, ProductUpdate> {
  protected getDelegate(): PrismaModelDelegate<Product, ProductCreate, ProductUpdate> {
    return {
      findUnique: (args) => this.prisma.product.findUnique({
        ...args,
        include: { 
          categories: {
            include: {
              category: true,
            },
          },
        },
      }),
      findMany: (args) => {
        return this.prisma.product.findMany({
          ...args,
          include: { 
            categories: {
              include: {
                category: true,
              },
            },
          },
        });
      },
      create: (args) => this.prisma.product.create({
        ...args,
        include: { 
          categories: {
            include: {
              category: true,
            },
          },
        },
      }),
      update: (args) => this.prisma.product.update({
        ...args,
        include: { 
          categories: {
            include: {
              category: true,
            },
          },
        },
      }),
      delete: (args) => this.prisma.product.delete({
        ...args,
        include: { 
          categories: {
            include: {
              category: true,
            },
          },
        },
      }),
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