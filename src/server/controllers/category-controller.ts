import { NextResponse } from 'next/server';
import { CategoryService } from '../services/category-service';
import { categoryCreateSchema, categoryUpdateSchema } from '../schemas/category-schema';
import { ErrorHandler } from '../errors/error-handler';

export class CategoryController {
  private readonly service: CategoryService;

  constructor() {
    this.service = new CategoryService();
  }

  async create(req: Request) {
    try {
      const data = await req.json();
      const validatedData = categoryCreateSchema.parse(data);
      const category = await this.service.create(validatedData);

      return NextResponse.json({ success: true, data: category });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async getById(req: Request, id: string) {
    try {
      const category = await this.service.findById(id);
      return NextResponse.json({ success: true, data: category });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async getAll(req: Request) {
    try {
      const categories = await this.service.findAll();
      return NextResponse.json({ success: true, data: categories });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async update(req: Request, id: string) {
    try {
      const data = await req.json();
      const validatedData = categoryUpdateSchema.parse(data);
      const category = await this.service.update(id, validatedData);

      return NextResponse.json({ success: true, data: category });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async delete(req: Request, id: string) {
    try {
      const category = await this.service.delete(id);
      return NextResponse.json({ success: true, data: category });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }
}

