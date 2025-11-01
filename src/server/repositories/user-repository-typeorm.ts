import { User } from '@/entities/User';
import { BaseRepositoryTypeORM } from './base-repository-typeorm';
import { UserCreate, UserUpdate } from '../schemas/user-schema';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { getDataSource } from '@/lib/typeorm';

export class UserRepositoryTypeORM extends BaseRepositoryTypeORM<User> {
  protected getEntity(): new () => User {
    return User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const repository = await this.getRepository();
    return await repository.findOne({ where: { email } as any });
  }

  // Custom create method - don't override base create to avoid type conflicts
  async createUser(data: UserCreate): Promise<User> {
    return await super.create({
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role || 'CUSTOMER',
    } as Partial<User>);
  }
}
