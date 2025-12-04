import { getDataSource } from '@/lib/typeorm';
import { CategoryServiceTypeORM } from '@/server/services/category-service-typeorm';
import { Product } from '@/entities/Product';
import { ProductCategory } from '@/entities/ProductCategory';
import { ObjectId } from 'mongodb';

/**
 * Migration script to assign default category to products without categoryId
 * Run this after creating categories in admin panel
 */
export async function migrateProductsWithoutCategory() {
  try {
    const categoryService = new CategoryServiceTypeORM();
    const dataSource = await getDataSource();
    const productRepo = dataSource.getRepository(Product);
    const productCategoryRepo = dataSource.getRepository(ProductCategory);
    
    // Get or create a default category
    let defaultCategory = await categoryService.findByName('Main Course');
    if (!defaultCategory) {
      // If Main Course doesn't exist, get the first available category
      const categories = await categoryService.findAll();
      if (categories.length === 0) {
        console.log('No categories found. Please create categories in admin panel first.');
        return;
      }
      defaultCategory = categories[0];
    }

    // Find all products
    const allProducts = await productRepo.find();
    
    // Find products without categories
    const allProductCategories = await productCategoryRepo.find();
    const productsWithCategories = new Set(
      allProductCategories.map(pc => pc.productId.toString())
    );
    
    const productsWithoutCategory = allProducts.filter(
      p => !productsWithCategories.has(p.id.toString())
    );

    if (productsWithoutCategory.length === 0) {
      console.log('No products without category found.');
      return;
    }

    console.log(`Found ${productsWithoutCategory.length} products without category. Updating...`);

    // Update all products to use default category
    const defaultCategoryId = defaultCategory.id instanceof ObjectId 
      ? defaultCategory.id 
      : new ObjectId(String(defaultCategory.id));
    
    for (const product of productsWithoutCategory) {
      const productId = product.id instanceof ObjectId 
        ? product.id 
        : new ObjectId(String(product.id));
      await productCategoryRepo.save(
        productCategoryRepo.create({
          productId,
          categoryId: defaultCategoryId,
        })
      );
    }

    console.log(`Successfully updated ${productsWithoutCategory.length} products with category: ${defaultCategory.name}`);
  } catch (error) {
    console.error('Failed to migrate products:', error);
    throw error;
  }
}

