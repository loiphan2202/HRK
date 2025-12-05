import { Table, TableStatus } from '@/entities/Table';
import { BaseRepositoryTypeORM } from './base-repository-typeorm';
import { TableCreate, TableUpdate } from '../schemas/table-schema';
import { FindOptionsWhere } from 'typeorm';

export class TableRepositoryTypeORM extends BaseRepositoryTypeORM<Table> {
  protected getEntity(): new () => Table {
    return Table;
  }

  async findByNumber(number: number): Promise<Table | null> {
    const repository = await this.getRepository();
    return await repository.findOne({ where: { number } as FindOptionsWhere<Table> });
  }

  async findByToken(token: string): Promise<Table | null> {
    const repository = await this.getRepository();
    return await repository.findOne({ where: { token } as FindOptionsWhere<Table> });
  }

  async findByQrCode(qrCode: string): Promise<Table | null> {
    const repository = await this.getRepository();
    return await repository.findOne({ where: { qrCode } as FindOptionsWhere<Table> });
  }

  // Custom create method - don't override base create to avoid type conflicts
  async createTable(data: TableCreate): Promise<Table> {
    return await super.create({
      number: data.number,
      status: data.status || TableStatus.AVAILABLE,
    } as Partial<Table>);
  }

  async update(id: string, data: TableUpdate): Promise<Table> {
    return await super.update(id, data as Partial<Table>);
  }
}
