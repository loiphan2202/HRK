import { Category } from '@/entities/Category';
import { CategoryRepositoryTypeORM } from '../repositories/category-repository-typeorm';
import { CategoryCreate, CategoryUpdate } from '../schemas/category-schema';
import { NotFoundError, BadRequestError } from '../errors/base-error';

export class CategoryServiceTypeORM {
  private readonly repository: CategoryRepositoryTypeORM;

  constructor() {
    this.repository = new CategoryRepositoryTypeORM();
  }

  async findById(id: string): Promise<Category> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  async findByName(name: string): Promise<Category | null> {
    return await this.repository.findByName(name);
  }

  async findAll(): Promise<Category[]> {
    return await this.repository.findAll();
  }

  async create(data: CategoryCreate): Promise<Category> {
    // Check if category name already exists
    const existing = await this.repository.findByName(data.name);
    if (existing) {
      throw new BadRequestError(`Category ${data.name} already exists`);
    }
    return await this.repository.createCategory(data);
  }

  async update(id: string, data: CategoryUpdate): Promise<Category> {
    await this.findById(id);
    
    // Check if name is being updated and already exists
    if (data.name) {
      const existing = await this.repository.findByName(data.name);
      if (existing && existing.id.toString() !== id) {
        throw new BadRequestError(`Category ${data.name} already exists`);
      }
    }

    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<Category> {
    await this.findById(id);
    return await this.repository.delete(id);
  }
}
