import { Table } from '@/entities/Table';
import { TableRepositoryTypeORM } from '../repositories/table-repository-typeorm';
import { TableCreate, TableUpdate } from '../schemas/table-schema';
import { NotFoundError, BadRequestError } from '../errors/base-error';

export class TableServiceTypeORM {
  private readonly repository: TableRepositoryTypeORM;

  constructor() {
    this.repository = new TableRepositoryTypeORM();
  }

  async findById(id: string): Promise<Table> {
    const table = await this.repository.findById(id);
    if (!table) {
      throw new NotFoundError('Table not found');
    }
    return table;
  }

  async findByNumber(number: number): Promise<Table | null> {
    return await this.repository.findByNumber(number);
  }

  async findByToken(token: string): Promise<Table | null> {
    return await this.repository.findByToken(token);
  }

  async findByQrCode(qrCode: string): Promise<Table | null> {
    return await this.repository.findByQrCode(qrCode);
  }

  async generateQrCode(id: string, baseUrl: string): Promise<Table> {
    await this.findById(id);
    
    const { generateToken, generateQrCodeImage } = await import('@/lib/qr-code');
    const token = generateToken();
    const checkInUrl = `${baseUrl}/check-in?token=${token}`;
    
    // Generate QR code image
    const qrCodeImage = await generateQrCodeImage(checkInUrl);
    
    // Update table with token and QR code image
    const updated = await this.repository.update(id, {
      token,
      qrCode: qrCodeImage,
    });

    return updated;
  }

  async findAll(): Promise<Table[]> {
    return await this.repository.findAll();
  }

  async create(data: TableCreate): Promise<Table> {
    // Check if table number already exists
    const existing = await this.repository.findByNumber(data.number);
    if (existing) {
      throw new BadRequestError(`Table number ${data.number} already exists`);
    }
    return await this.repository.createTable(data);
  }

  async update(id: string, data: TableUpdate): Promise<Table> {
    await this.findById(id);
    
    // Check if table number is being updated and already exists
    if (data.number) {
      const existing = await this.repository.findByNumber(data.number);
      if (existing && existing.id.toString() !== id) {
        throw new BadRequestError(`Table number ${data.number} already exists`);
      }
    }

    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<Table> {
    await this.findById(id);
    return await this.repository.delete(id);
  }

  async updateStatus(id: string, status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'): Promise<Table> {
    return await this.update(id, { status });
  }
}
