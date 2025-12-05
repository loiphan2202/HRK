import { Repository, ObjectLiteral, FindOptionsWhere } from 'typeorm';
import { ObjectId } from 'mongodb';
import { getDataSource } from '@/lib/typeorm';

// Type for MongoDB where clause with _id or id
type MongoWhereClause<T> = FindOptionsWhere<T> | { _id: ObjectId } | { id: ObjectId };

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
    const whereClause1: MongoWhereClause<T> = { _id: objectId } as MongoWhereClause<T>;
    const whereClause2: MongoWhereClause<T> = { id: objectId } as MongoWhereClause<T>;
    return await repository.findOne({ where: whereClause1 as FindOptionsWhere<T> }) ?? 
           await repository.findOne({ where: whereClause2 as FindOptionsWhere<T> });
  }

  async findAll(): Promise<T[]> {
    const repository = await this.getRepository();
    return await repository.find();
  }

  async create(data: Partial<T>): Promise<T> {
    const repository = await this.getRepository();
    const entity = repository.create(data as T);
    const saved = await repository.save(entity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async update(id: string | ObjectId, data: Partial<T>): Promise<T> {
    const repository = await this.getRepository();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    
    // Find the entity first to ensure it exists
    const whereClause: MongoWhereClause<T> = { _id: objectId } as MongoWhereClause<T>;
    const entity = await repository.findOne({ where: whereClause as FindOptionsWhere<T> });
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
    const whereClause: MongoWhereClause<T> = { _id: objectId } as MongoWhereClause<T>;
    const entity = await repository.findOne({ where: whereClause as FindOptionsWhere<T> });
    if (!entity) {
      throw new Error(`Entity with id ${id} not found`);
    }
    await repository.remove(entity);
    return entity;
  }
}
