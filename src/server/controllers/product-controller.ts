import { NextResponse } from 'next/server';
import { ProductServiceTypeORM } from '../services/product-service-typeorm';
import { productCreateSchema, productUpdateSchema, ProductUpdate } from '../schemas/product-schema';
import { ErrorHandler } from '../errors/error-handler';
import { uploadFromForm } from '@/server/utils/cloudinary';
import { serializeEntity } from '../utils/typeorm-helpers';

export class ProductController {
  private readonly service: ProductServiceTypeORM;

  constructor() {
    this.service = new ProductServiceTypeORM();
  }

  private processCategoryIds(form: FormData): string[] {
    const values = form.getAll('categoryIds');
    return values
      .filter(v => typeof v === 'string' && v.trim() !== '')
      .map(v => v as string);
  }

  private processPrice(value: string): number | undefined {
    const numValue = Number(value);
    if (!Number.isNaN(numValue)) {
      return numValue;
    }
    return undefined;
  }

  private processStock(value: string): number | null {
    if (value === '' || value === 'null') {
      return null;
    }
    const numValue = Number(value);
    if (!Number.isNaN(numValue)) {
      return numValue;
    }
    return null;
  }

  private processFieldValue(key: string, value: string): string | number | null | undefined {
    if (key === 'price') {
      return this.processPrice(value);
    }
    if (key === 'stock') {
      return this.processStock(value);
    }
    return value;
  }

  private async processFormData(form: FormData): Promise<Record<string, string | number | null | string[]>> {
    const data: Record<string, string | number | null | string[]> = {};
    
    for (const key of Array.from(form.keys())) {
      if (key === 'categoryIds') {
        data[key] = this.processCategoryIds(form);
      } else {
        const value = form.get(key);
        if (typeof value === 'string') {
          const processedValue = this.processFieldValue(key, value);
          if (processedValue !== undefined) {
            data[key] = processedValue;
          }
        }
      }
    }
    
    return data;
  }

  private async handleImageUpload(form: FormData, id: string, validated: ProductUpdate) {
    const imageFile = form.get('image');
    if (imageFile && imageFile instanceof Blob && imageFile.size > 0) {
      try {
        const imagePath = await uploadFromForm(form, 'image', 'products', id);
        if (imagePath) {
          return await this.service.update(id, { ...validated, image: imagePath });
        }
      } catch (error) {
        console.error('Error saving image:', error);
        throw new Error('Invalid image file. Only JPEG, PNG, GIF, and WEBP are allowed.');
      }
    }
    return null;
  }

  async create(req: Request) {
    try {
      const contentType = req.headers.get('content-type') || '';

      if (contentType.includes('multipart/form-data')) {
        const form = await req.formData();
        const formData = await this.processFormData(form);
        const validated = productCreateSchema.parse(formData);
        const product = await this.service.create(validated);

        // save file if provided
        const productId = typeof product.id === 'string' ? product.id : product.id.toString();
        const imagePath = await uploadFromForm(form, 'image', 'products', productId);
        if (imagePath) {
          await this.service.update(productId, { image: imagePath });
          const updated = await this.service.findById(productId);
          return NextResponse.json({ success: true, data: serializeEntity(updated) });
        }

        return NextResponse.json({ success: true, data: serializeEntity(product) });
      } else {
        const data = await req.json();
        const validated = productCreateSchema.parse(data);
        const product = await this.service.create(validated);
        return NextResponse.json({ success: true, data: serializeEntity(product) });
      }
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async update(req: Request, id: string) {
    try {
      const contentType = req.headers.get('content-type') || '';
      console.log('Update request content-type:', contentType);

      if (contentType.includes('multipart/form-data')) {
        const form = await req.formData();
        console.log('Update form data:', Object.fromEntries(form.entries()));
        
        // Xử lý dữ liệu form
        const formData = await this.processFormData(form);
        console.log('Processed update data:', formData);
        
        // Validate dữ liệu
        const validatedData = productUpdateSchema.parse(formData);

        try {
          // Xử lý upload ảnh nếu có
          const updatedWithImage = await this.handleImageUpload(form, id, validatedData);
          if (updatedWithImage) {
            return NextResponse.json({ success: true, data: serializeEntity(updatedWithImage) });
          }

          // Nếu không có ảnh mới hoặc ảnh không hợp lệ, chỉ cập nhật thông tin khác
          const product = await this.service.update(id, validatedData);
          return NextResponse.json({ success: true, data: serializeEntity(product) });
        } catch (error) {
          return ErrorHandler.handle(error);
        }
      } else {
        const data = await req.json();
        const validated = productUpdateSchema.parse(data);
        const product = await this.service.update(id, validated);
        return NextResponse.json({ success: true, data: serializeEntity(product) });
      }
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async delete(req: Request, id: string) {
    try {
      const product = await this.service.delete(id);
      return NextResponse.json({ success: true, data: serializeEntity(product) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async getById(req: Request, id: string) {
    try {
      const product = await this.service.findById(id);
      return NextResponse.json({ success: true, data: serializeEntity(product) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async getAll() {
    try {
      const products = await this.service.findAll();
      return NextResponse.json({ success: true, data: products.map(p => serializeEntity(p)) });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }
}

