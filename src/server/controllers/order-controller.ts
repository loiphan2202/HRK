import { NextResponse } from 'next/server';
import { OrderServiceTypeORM } from '../services/order-service-typeorm';
import { orderCreateSchema, orderUpdateSchema } from '../schemas/order-schema';
import { ErrorHandler } from '../errors/error-handler';
import { serializeEntity } from '../utils/typeorm-helpers';

export class OrderController {
  private readonly service: OrderServiceTypeORM;

  constructor() {
    this.service = new OrderServiceTypeORM();
  }

  async create(req: Request) {
    try {
      const data = await req.json();
      const validatedData = orderCreateSchema.parse(data);
      const order = await this.service.create(validatedData);

      return NextResponse.json({ success: true, data: serializeEntity(order) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async getById(req: Request, id: string) {
    try {
      const order = await this.service.findById(id);
      return NextResponse.json({ success: true, data: serializeEntity(order) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async getByUserId(req: Request, userId: string) {
    try {
      const orders = await this.service.findByUserId(userId);
      return NextResponse.json({ success: true, data: orders.map(o => serializeEntity(o)) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async getAll(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const tableNumber = searchParams.get('tableNumber');
      const status = searchParams.get('status');
      
      const orders = await this.service.findAll({ tableNumber, status });
      return NextResponse.json({ success: true, data: orders.map(o => serializeEntity(o)) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async update(req: Request, id: string) {
    try {
      const data = await req.json();
      const validatedData = orderUpdateSchema.parse(data);
      const order = await this.service.update(id, validatedData);

      return NextResponse.json({ success: true, data: serializeEntity(order) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }
}