import { Category } from '@/generated/prisma/client';
import { CategoryRepository } from '../repositories/category-repository';
import { CategoryCreate, CategoryUpdate } from '../schemas/category-schema';
import { NotFoundError, BadRequestError } from '../errors/base-error';

export class CategoryService {
  private readonly repository: CategoryRepository;

  constructor() {
    this.repository = new CategoryRepository();
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
    return await this.repository.create(data);
  }

  async update(id: string, data: CategoryUpdate): Promise<Category> {
    await this.findById(id);
    
    // Check if name is being updated and already exists
    if (data.name) {
      const existing = await this.repository.findByName(data.name);
      if (existing && existing.id !== id) {
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

