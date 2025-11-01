import { Table, TableStatus } from '@/entities/Table';
import { BaseRepositoryTypeORM } from './base-repository-typeorm';
import { TableCreate, TableUpdate } from '../schemas/table-schema';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { getDataSource } from '@/lib/typeorm';

export class TableRepositoryTypeORM extends BaseRepositoryTypeORM<Table> {
  protected getEntity(): new () => Table {
    return Table;
  }

  async findByNumber(number: number): Promise<Table | null> {
    const repository = await this.getRepository();
    return await repository.findOne({ where: { number } as any });
  }

  async findByToken(token: string): Promise<Table | null> {
    const repository = await this.getRepository();
    return await repository.findOne({ where: { token } as any });
  }

  async findByQrCode(qrCode: string): Promise<Table | null> {
    const repository = await this.getRepository();
    return await repository.findOne({ where: { qrCode } as any });
  }

  // Custom create method - don't override base create to avoid type conflicts
  async createTable(data: TableCreate): Promise<Table> {
    return await super.create({
      number: data.number,
      status: (data.status as any) || TableStatus.AVAILABLE,
    } as Partial<Table>);
  }

  async update(id: string, data: TableUpdate): Promise<Table> {
    return await super.update(id, data as Partial<Table>);
  }
}
