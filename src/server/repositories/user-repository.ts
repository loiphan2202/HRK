import { User } from '@/generated/prisma/client';
import { BaseRepository, PrismaModelDelegate } from './base-repository';
import { UserCreate, UserUpdate } from '../schemas/user-schema';

export class UserRepository extends BaseRepository<User, UserCreate, UserUpdate> {
  protected getDelegate(): PrismaModelDelegate<User, UserCreate, UserUpdate> {
    return {
      findUnique: (args) => this.prisma.user.findUnique(args),
      findMany: (args) => this.prisma.user.findMany(args),
      create: (args) => this.prisma.user.create(args),
      update: (args) => this.prisma.user.update(args),
      delete: (args) => this.prisma.user.delete(args),
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }
}
