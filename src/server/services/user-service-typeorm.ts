import { User, UserRole } from '@/entities/User';
import { UserRepositoryTypeORM } from '../repositories/user-repository-typeorm';
import { UserCreate, UserUpdate } from '../schemas/user-schema';
import { NotFoundError, BadRequestError } from '../errors/base-error';
import * as bcrypt from 'bcrypt';

export class UserServiceTypeORM {
  private readonly repository: UserRepositoryTypeORM;

  constructor() {
    this.repository = new UserRepositoryTypeORM();
  }

  async findById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findByEmail(email);
  }

  async create(data: UserCreate): Promise<User> {
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestError('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return await this.repository.createUser({
      ...data,
      password: hashedPassword,
    });
  }

  async update(id: string, data: UserUpdate): Promise<User> {
    await this.findById(id); // Check if user exists

    if (data.email) {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser && existingUser.id.toString() !== id) {
        throw new BadRequestError('Email already in use');
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    // Prepare update data with proper type casting
    const updateData: Partial<User> = {
      ...(data.email && { email: data.email }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.password && { password: data.password }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.role && { role: UserRole[data.role as keyof typeof UserRole] }),
    };

    return await this.repository.update(id, updateData);
  }

  async delete(id: string): Promise<User> {
    await this.findById(id); // Check if user exists
    return await this.repository.delete(id);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }
}
