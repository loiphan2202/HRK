import { NextResponse } from 'next/server';
import { ProductService } from '../services/product-service';
import { productCreateSchema, productUpdateSchema, ProductUpdate } from '../schemas/product-schema';
import { ErrorHandler } from '../errors/error-handler';
import { saveFileFromForm } from '@/server/utils/upload';

export class ProductController {
  private readonly service: ProductService;

  constructor() {
    this.service = new ProductService();
  }

  private async processFormData(form: FormData): Promise<Record<string, string | number | null | string[]>> {
    const data: Record<string, string | number | null | string[]> = {};
    for (const key of Array.from(form.keys())) {
      if (key === 'categoryIds') {
        // Xử lý categoryIds: lấy tất cả giá trị với key này
        const values = form.getAll(key);
        const categoryIds = values
          .filter(v => typeof v === 'string' && v.trim() !== '')
          .map(v => v as string);
        data[key] = categoryIds;
      } else {
        const value = form.get(key);
        if (typeof value === 'string') {
          if (key === 'price') {
            const numValue = Number(value);
            if (!Number.isNaN(numValue)) {
              data[key] = numValue;
            }
          } else if (key === 'stock') {
            // Xử lý stock: empty string -> null, -1 -> -1, số khác -> số
            if (value === '' || value === 'null') {
              data[key] = null;
            } else {
              const numValue = Number(value);
              if (!Number.isNaN(numValue)) {
                data[key] = numValue;
              } else {
                data[key] = null;
              }
            }
          } else {
            data[key] = value;
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
        const imagePath = await saveFileFromForm(form, 'image', 'products', id);
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
        const imagePath = await saveFileFromForm(form, 'image', 'products', product.id);
        if (imagePath) {
          await this.service.update(product.id, { image: imagePath });
          const updated = await this.service.findById(product.id);
          return NextResponse.json({ success: true, data: updated });
        }

        return NextResponse.json({ success: true, data: product });
      } else {
        const data = await req.json();
        const validated = productCreateSchema.parse(data);
        const product = await this.service.create(validated);
        return NextResponse.json({ success: true, data: product });
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
            return NextResponse.json({ success: true, data: updatedWithImage });
          }

          // Nếu không có ảnh mới hoặc ảnh không hợp lệ, chỉ cập nhật thông tin khác
          const product = await this.service.update(id, validatedData);
          return NextResponse.json({ success: true, data: product });
        } catch (error) {
          return ErrorHandler.handle(error);
        }
      } else {
        const data = await req.json();
        const validated = productUpdateSchema.parse(data);
        const product = await this.service.update(id, validated);
        return NextResponse.json({ success: true, data: product });
      }
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async delete(req: Request, id: string) {
    try {
      const product = await this.service.delete(id);
      return NextResponse.json({ success: true, data: product });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async getById(req: Request, id: string) {
    try {
      const product = await this.service.findById(id);
      return NextResponse.json({ success: true, data: product });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }

  async getAll() {
    try {
      const products = await this.service.findAll();
      return NextResponse.json({ success: true, data: products });
    } catch (error: unknown) {
      return ErrorHandler.handle(error);
    }
  }
}

