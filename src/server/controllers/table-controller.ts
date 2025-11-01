import { NextResponse } from 'next/server';
import { TableServiceTypeORM } from '../services/table-service-typeorm';
import { tableCreateSchema, tableUpdateSchema } from '../schemas/table-schema';
import { ErrorHandler } from '../errors/error-handler';
import { serializeEntity } from '../utils/typeorm-helpers';

export class TableController {
  private readonly service: TableServiceTypeORM;

  constructor() {
    this.service = new TableServiceTypeORM();
  }

  async create(req: Request) {
    try {
      const data = await req.json();
      const validatedData = tableCreateSchema.parse(data);
      const table = await this.service.create(validatedData);

      return NextResponse.json({ success: true, data: serializeEntity(table) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async getById(req: Request, id: string) {
    try {
      const table = await this.service.findById(id);
      return NextResponse.json({ success: true, data: serializeEntity(table) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async getAll(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const number = searchParams.get('number');
      
      if (number) {
        const table = await this.service.findByNumber(parseInt(number));
        return NextResponse.json({ success: true, data: table ? serializeEntity(table) : null });
      }

      const tables = await this.service.findAll();
      return NextResponse.json({ success: true, data: tables.map(t => serializeEntity(t)) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async update(req: Request, id: string) {
    try {
      const data = await req.json();
      const validatedData = tableUpdateSchema.parse(data);
      const table = await this.service.update(id, validatedData);

      return NextResponse.json({ success: true, data: serializeEntity(table) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async delete(req: Request, id: string) {
    try {
      const table = await this.service.delete(id);
      return NextResponse.json({ success: true, data: serializeEntity(table) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async generateQrCode(req: Request, id: string) {
    try {
      // Get base URL from request headers
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      const host = req.headers.get('host') || req.headers.get('x-forwarded-host') || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;
      
      const table = await this.service.generateQrCode(id, baseUrl);

      return NextResponse.json({ success: true, data: serializeEntity(table) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async checkIn(req: Request) {
    try {
      const data = await req.json();
      const { token } = data;
      
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Token is required' },
          { status: 400 }
        );
      }

      const table = await this.service.findByToken(token);
      
      if (!table) {
        return NextResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: { table: serializeEntity(table) } });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }
}

