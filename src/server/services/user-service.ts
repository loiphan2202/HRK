import { User } from '@/generated/prisma/client';
import { UserRepository } from '../repositories/user-repository';
import { UserCreate, UserUpdate } from '../schemas/user-schema';
import { NotFoundError, BadRequestError } from '../errors/base-error';
import * as bcrypt from 'bcrypt';

export class UserService {
  private readonly repository: UserRepository;

  constructor() {
    this.repository = new UserRepository();
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
    return await this.repository.create({
      ...data,
      password: hashedPassword,
    });
  }

  async update(id: string, data: UserUpdate): Promise<User> {
    await this.findById(id); // Check if user exists

    if (data.email) {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestError('Email already in use');
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<User> {
    await this.findById(id); // Check if user exists
    return await this.repository.delete(id);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }
}