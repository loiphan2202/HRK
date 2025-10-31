import { Table } from '@/generated/prisma/client';
import { BaseRepository, PrismaModelDelegate } from './base-repository';
import { TableCreate, TableUpdate } from '../schemas/table-schema';

export class TableRepository extends BaseRepository<Table, TableCreate, TableUpdate> {
  protected getDelegate(): PrismaModelDelegate<Table, TableCreate, TableUpdate> {
    return {
      findUnique: (args) => this.prisma.table.findUnique(args),
      findMany: (args) => this.prisma.table.findMany(args),
      create: (args) => this.prisma.table.create(args),
      update: (args) => this.prisma.table.update(args),
      delete: (args) => this.prisma.table.delete(args),
    };
  }

  async findByNumber(number: number): Promise<Table | null> {
    return await this.prisma.table.findUnique({
      where: { number },
    });
  }

  async findByQrCode(qrCode: string): Promise<Table | null> {
    return await this.prisma.table.findFirst({
      where: { qrCode },
    });
  }

  async findByToken(token: string): Promise<Table | null> {
    return await this.prisma.table.findUnique({
      where: { token },
    });
  }
}

