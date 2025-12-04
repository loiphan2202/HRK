import { Repository, ObjectLiteral } from 'typeorm';
import { ObjectId } from 'mongodb';
import { getDataSource } from '@/lib/typeorm';

export abstract class BaseRepositoryTypeORM<T extends ObjectLiteral> {
  protected abstract getEntity(): new () => T;

  protected async getRepository(): Promise<Repository<T>> {
    const dataSource = await getDataSource();
    // Ensure DataSource is initialized
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    return dataSource.getRepository(this.getEntity());
  }

  async findById(id: string | ObjectId): Promise<T | null> {
    const repository = await this.getRepository();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    // For MongoDB, we use _id instead of id
    return await repository.findOne({ where: { _id: objectId } as any }) ?? 
           await repository.findOne({ where: { id: objectId } as any });
  }

  async findAll(): Promise<T[]> {
    const repository = await this.getRepository();
    return await repository.find();
  }

  async create(data: Partial<T>): Promise<T> {
    const repository = await this.getRepository();
    const entity = repository.create(data as any);
    const saved = await repository.save(entity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async update(id: string | ObjectId, data: Partial<T>): Promise<T> {
    const repository = await this.getRepository();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    
    // Find the entity first to ensure it exists
    const entity = await repository.findOne({ where: { _id: objectId } as any });
    if (!entity) {
      throw new Error(`Entity with id ${id} not found`);
    }
    
    // Update the entity by merging data and saving
    // This ensures only one document is updated (the one we found)
    Object.assign(entity, data);
    const updated = await repository.save(entity);
    return Array.isArray(updated) ? updated[0] : updated;
  }

  async delete(id: string | ObjectId): Promise<T> {
    const repository = await this.getRepository();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const entity = await repository.findOne({ where: { _id: objectId } as any });
    if (!entity) {
      throw new Error(`Entity with id ${id} not found`);
    }
    await repository.remove(entity as any);
    return entity;
  }
}
