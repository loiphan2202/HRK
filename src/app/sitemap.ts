import { MetadataRoute } from 'next'
import { getDataSource } from '@/lib/typeorm'
import { Product } from '@/entities/Product'
import { Category } from '@/entities/Category'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Dynamic routes - Products
  let productRoutes: MetadataRoute.Sitemap = []
  // Skip database connection during build to avoid errors
  if (process.env.NEXT_PHASE !== 'phase-production-build' && process.env.DATABASE_URL) {
    try {
      const dataSource = await getDataSource()
      const productRepository = dataSource.getRepository(Product)
      const products = await productRepository.find({
        select: ['id'],
      })

      productRoutes = products.map((product) => ({
        url: `${baseUrl}/${product.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    } catch (error) {
      console.error('Error fetching products for sitemap:', error)
    }
  }

  // Dynamic routes - Shop categories
  let categoryRoutes: MetadataRoute.Sitemap = []
  // Skip database connection during build to avoid errors
  if (process.env.NEXT_PHASE !== 'phase-production-build' && process.env.DATABASE_URL) {
    try {
      const dataSource = await getDataSource()
      const categoryRepository = dataSource.getRepository(Category)
      const categories = await categoryRepository.find({
        select: ['id'],
      })

      categoryRoutes = categories.map((category) => ({
        url: `${baseUrl}/shop/${category.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    } catch (error) {
      console.error('Error fetching categories for sitemap:', error)
    }
  }

  return [...staticRoutes, ...productRoutes, ...categoryRoutes]
}

