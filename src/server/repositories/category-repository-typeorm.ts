import { Category } from '@/entities/Category';
import { BaseRepositoryTypeORM } from './base-repository-typeorm';
import { CategoryCreate, CategoryUpdate } from '../schemas/category-schema';

export class CategoryRepositoryTypeORM extends BaseRepositoryTypeORM<Category> {
  protected getEntity(): new () => Category {
    return Category;
  }

  async findByName(name: string): Promise<Category | null> {
    const repository = await this.getRepository();
    return await repository.findOne({ where: { name } as any });
  }

  // Custom create method - don't override base create to avoid type conflicts
  async createCategory(data: CategoryCreate): Promise<Category> {
    return await super.create({
      name: data.name,
    } as Partial<Category>);
  }

  async update(id: string, data: CategoryUpdate): Promise<Category> {
    return await super.update(id, data as Partial<Category>);
  }
}
