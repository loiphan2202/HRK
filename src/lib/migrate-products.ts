import { prisma } from '@/lib/prisma';
import { CategoryService } from '@/server/services/category-service';

/**
 * Migration script to assign default category to products without categoryId
 * Run this after creating categories in admin panel
 */
export async function migrateProductsWithoutCategory() {
  try {
    const categoryService = new CategoryService();
    
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

    // Find all products without categoryId
    const productsWithoutCategory = await prisma.product.findMany({
      where: {
        categories: {
          none: {},
        },
      },
      include: {
        categories: true,
      },
    });

    if (productsWithoutCategory.length === 0) {
      console.log('No products without category found.');
      return;
    }

    console.log(`Found ${productsWithoutCategory.length} products without category. Updating...`);

    // Update all products to use default category
    for (const product of productsWithoutCategory) {
      await prisma.productCategory.create({
        data: {
          productId: product.id,
          categoryId: defaultCategory.id,
        },
      });
    }

    console.log(`Successfully updated ${productsWithoutCategory.length} products with category: ${defaultCategory.name}`);
  } catch (error) {
    console.error('Failed to migrate products:', error);
    throw error;
  }
}

