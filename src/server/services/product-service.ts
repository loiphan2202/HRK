import { Product } from '@/generated/prisma/client';
import { ProductRepository } from '../repositories/product-repository';
import { ProductCreate, ProductUpdate } from '../schemas/product-schema';
import { NotFoundError, BadRequestError } from '../errors/base-error';
import { prisma } from '@/lib/prisma';

export class ProductService {
  private readonly repository: ProductRepository;

  constructor() {
    this.repository = new ProductRepository();
  }

  async findById(id: string): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  async findAll(): Promise<Product[]> {
    return await this.repository.findAll();
  }

  async create(data: ProductCreate): Promise<Product> {
    // Cho phép stock = -1 (unlimited) hoặc null (không theo dõi stock)
    if (data.stock !== undefined && data.stock !== null && data.stock < -1) {
      throw new BadRequestError('Stock cannot be less than -1 (use -1 for unlimited)');
    }
    if (data.price <= 0) {
      throw new BadRequestError('Price must be positive');
    }
    
    // Tách categoryIds ra khỏi data để xử lý riêng
    const { categoryIds, ...productData } = data;
    
    // Tạo product với categories
    const product = await prisma.product.create({
      data: {
        ...productData,
        categories: {
          create: (categoryIds || []).map(categoryId => ({
            categoryId,
          })),
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
    
    return product as Product;
  }

  async update(id: string, data: ProductUpdate): Promise<Product> {
    await this.findById(id); // Check if product exists

    // Cho phép stock = -1 (unlimited) hoặc null (không theo dõi stock)
    if (data.stock !== undefined && data.stock !== null && data.stock < -1) {
      throw new BadRequestError('Stock cannot be less than -1 (use -1 for unlimited)');
    }
    if (data.price !== undefined && data.price <= 0) {
      throw new BadRequestError('Price must be positive');
    }
    
    // Tách categoryIds ra khỏi data để xử lý riêng
    const { categoryIds, ...productData } = data;
    
    // Nếu có categoryIds, cập nhật categories
    if (categoryIds !== undefined) {
      // Xóa tất cả categories hiện tại và tạo mới
      await prisma.productCategory.deleteMany({
        where: { productId: id },
      });
      
      return await prisma.product.update({
        where: { id },
        data: {
          ...productData,
          categories: {
            create: categoryIds.map(categoryId => ({
              categoryId,
            })),
          },
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      }) as Product;
    }
    
    return await this.repository.update(id, productData);
  }

  async delete(id: string): Promise<Product> {
    const product = await this.findById(id); // Check if product exists
    
    // Sử dụng transaction để xóa OrderProduct trước, sau đó xóa Product
    return await prisma.$transaction(async (tx) => {
      // Xóa tất cả OrderProduct liên quan đến product này
      await tx.orderProduct.deleteMany({
        where: { productId: id },
      });
      
      // Xóa file ảnh nếu có
      if (product.image) {
        try {
          const fs = await import('fs');
          const path = await import('path');
          const imagePath = path.join(process.cwd(), 'public', product.image);
          if (fs.existsSync(imagePath)) {
            await fs.promises.unlink(imagePath);
          }
        } catch (error) {
          console.error('Failed to delete product image:', error);
          // Tiếp tục xóa product dù có lỗi xóa ảnh
        }
      }
      
      // Xóa Product (ProductCategory sẽ tự động xóa do cascade)
      return await tx.product.delete({
        where: { id },
        include: { 
          categories: {
            include: {
              category: true,
            },
          },
        },
      });
    });
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findById(id);
    // Chỉ kiểm tra stock nếu product có stock tracking (stock !== null && stock >= 0)
    if (product.stock !== null && product.stock >= 0 && product.stock < quantity) {
      throw new BadRequestError('Insufficient stock');
    }
    // Nếu stock = -1 (unlimited) hoặc null, cho phép update
    return await this.repository.updateStock(id, quantity);
  }
}