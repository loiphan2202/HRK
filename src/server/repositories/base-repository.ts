import { PrismaClient, Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export interface PrismaModelDelegate<T, CreateInput, UpdateInput> {
  findUnique: (args: { where: { id: string } }) => Promise<T | null>;
  findMany: (args?: { where?: object }) => Promise<T[]>;
  create: (args: { data: CreateInput }) => Promise<T>;
  update: (args: { where: { id: string }; data: UpdateInput }) => Promise<T>;
  delete: (args: { where: { id: string } }) => Promise<T>;
}

export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected readonly prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  protected abstract getDelegate(): PrismaModelDelegate<T, CreateInput, UpdateInput>;

  async findById(id: string): Promise<T | null> {
    return await this.getDelegate().findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<T[]> {
    return await this.getDelegate().findMany();
  }

  async create(data: CreateInput): Promise<T> {
    return await this.getDelegate().create({
      data,
    });
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    return await this.getDelegate().update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<T> {
    return await this.getDelegate().delete({
      where: { id },
    });
  }
}
