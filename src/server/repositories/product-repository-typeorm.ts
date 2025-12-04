import { Product } from '@/entities/Product';
import { ProductCategory } from '@/entities/ProductCategory';
import { Category } from '@/entities/Category';
import { OrderProduct } from '@/entities/OrderProduct';
import { BaseRepositoryTypeORM } from './base-repository-typeorm';
import { ProductCreate, ProductUpdate } from '../schemas/product-schema';
import { ObjectId } from 'mongodb';
import { getDataSource } from '@/lib/typeorm';

export class ProductRepositoryTypeORM extends BaseRepositoryTypeORM<Product> {
  protected getEntity(): new () => Product {
    return Product;
  }

  async findById(id: string | ObjectId): Promise<Product | null> {
    const dataSource = await getDataSource();
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    const productRepo = dataSource.getRepository(Product);
    const productCategoryRepo = dataSource.getRepository(ProductCategory);
    
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const product = await productRepo.findOne({ where: { _id: objectId } as any });
    
    if (!product) return null;

    // Load categories
    const productCategories = await productCategoryRepo.find({
      where: { productId: objectId } as any,
    });

    // Load category details
    const categoryIds = productCategories.map(pc => pc.categoryId);
    const categories = [];
    if (categoryIds.length > 0) {
      const categoryRepo = dataSource.getRepository(Category);
      for (const catId of categoryIds) {
        const cat = await categoryRepo.findOne({ where: { _id: catId } as any });
        if (cat) {
          categories.push({
            category: {
              id: cat.id.toString(),
              name: cat.name,
            },
          });
        }
      }
    }

    return {
      ...product,
      categories,
    } as any;
  }

  async findAll(): Promise<Product[]> {
    // Ensure DataSource is initialized and metadata is loaded
    const dataSource = await getDataSource();
    
    // Verify DataSource is initialized
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    
    const productRepo = dataSource.getRepository(Product);
    const productCategoryRepo = dataSource.getRepository(ProductCategory);
    const categoryRepo = dataSource.getRepository(Category);

    const products = await productRepo.find();

    // Load categories for all products
    // TypeORM MongoDB doesn't support $in directly, so we'll load all and filter
    const allProductCategories = await productCategoryRepo.find();
    const productIdSet = new Set(products.map(p => p.id.toString()));
    const relevantProductCategories = allProductCategories.filter(
      pc => productIdSet.has(pc.productId.toString())
    );

    // Group by productId
    const categoriesByProduct = new Map<string, any[]>();
    for (const pc of relevantProductCategories) {
      const productId = pc.productId.toString();
      if (!categoriesByProduct.has(productId)) {
        categoriesByProduct.set(productId, []);
      }
      const cat = await categoryRepo.findOne({ where: { _id: pc.categoryId } as any });
      if (cat) {
        categoriesByProduct.get(productId)!.push({
          category: {
            id: cat.id.toString(),
            name: cat.name,
          },
        });
      }
    }

    return products.map(p => ({
      ...p,
      categories: categoriesByProduct.get(p.id.toString()) || [],
    })) as any[];
  }

  async create(data: ProductCreate): Promise<Product> {
    const dataSource = await getDataSource();
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    const productRepo = dataSource.getRepository(Product);
    const productCategoryRepo = dataSource.getRepository(ProductCategory);

    const { categoryIds, ...productData } = data;

    // Create product
    const product = productRepo.create({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stock: productData.stock ?? null,
      image: productData.image,
    } as any);

    const saved = await productRepo.save(product);
    const savedProduct = Array.isArray(saved) ? saved[0] : saved;

    // Create product categories
    if (categoryIds && categoryIds.length > 0) {
      const productCategories = categoryIds.map(catId => 
        productCategoryRepo.create({
          productId: savedProduct.id,
          categoryId: new ObjectId(catId),
        } as any)
      );
      // Save each category separately to avoid array issues
      for (const productCategory of productCategories) {
        await productCategoryRepo.save(productCategory);
      }
    }

    // Load with categories
    const productId = typeof savedProduct.id === 'string' ? savedProduct.id : savedProduct.id.toString();
    return await this.findById(productId) as Product;
  }

  async update(id: string, data: ProductUpdate): Promise<Product> {
    const dataSource = await getDataSource();
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    const productRepo = dataSource.getRepository(Product);
    const productCategoryRepo = dataSource.getRepository(ProductCategory);

    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const { categoryIds, ...productData } = data;

    // Update product - find first then save to ensure only one document is updated
    if (Object.keys(productData).length > 0) {
      const existing = await productRepo.findOne({ where: { _id: objectId } as any });
      if (!existing) {
        throw new Error(`Product with id ${id} not found`);
      }
      Object.assign(existing, productData);
      await productRepo.save(existing);
    }

    // Update categories if provided
    if (categoryIds !== undefined) {
      // Delete existing
      await productCategoryRepo.delete({ productId: objectId } as any);

      // Create new ones
      if (categoryIds.length > 0) {
        const productCategories = categoryIds.map(catId =>
          productCategoryRepo.create({
            productId: objectId,
            categoryId: new ObjectId(catId),
          } as any)
        );
        // Save each category separately to avoid array issues
        for (const productCategory of productCategories) {
          await productCategoryRepo.save(productCategory);
        }
      }
    }

    // Load with categories
    return await this.findById(id) as Product;
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const dataSource = await getDataSource();
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    const productRepo = dataSource.getRepository(Product);
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    
    const product = await productRepo.findOne({ where: { _id: objectId } as any });
    if (!product) {
      throw new Error('Product not found');
    }

    const currentStock = product.stock;
    if (currentStock !== null && currentStock !== undefined && currentStock >= 0) {
      const newStock = currentStock - quantity;
      // Update by saving the entity to ensure only one document is updated
      product.stock = newStock;
      const updated = await productRepo.save(product);
      return Array.isArray(updated) ? updated[0] : updated;
    }

    return product;
  }

  async delete(id: string | ObjectId): Promise<Product> {
    const dataSource = await getDataSource();
    const productRepo = dataSource.getRepository(Product);
    const productCategoryRepo = dataSource.getRepository(ProductCategory);
    const orderProductRepo = dataSource.getRepository(OrderProduct);

    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const product = await productRepo.findOne({ where: { _id: objectId } as any });

    if (!product) {
      throw new Error('Product not found');
    }

    // Delete related order products
    await orderProductRepo.delete({ productId: objectId } as any);

    // Delete product categories (cascade)
    await productCategoryRepo.delete({ productId: objectId } as any);

    // Delete product
    await productRepo.remove(product as any);

    return product;
  }
}
