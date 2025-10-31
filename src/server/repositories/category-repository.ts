import { Category } from '@/generated/prisma/client';
import { BaseRepository, PrismaModelDelegate } from './base-repository';
import { CategoryCreate, CategoryUpdate } from '../schemas/category-schema';

export class CategoryRepository extends BaseRepository<Category, CategoryCreate, CategoryUpdate> {
  protected getDelegate(): PrismaModelDelegate<Category, CategoryCreate, CategoryUpdate> {
    return {
      findUnique: (args) => this.prisma.category.findUnique(args),
      findMany: (args) => this.prisma.category.findMany(args),
      create: (args) => this.prisma.category.create(args),
      update: (args) => this.prisma.category.update(args),
      delete: (args) => this.prisma.category.delete(args),
    };
  }

  async findByName(name: string): Promise<Category | null> {
    return await this.prisma.category.findUnique({
      where: { name },
    });
  }
}

