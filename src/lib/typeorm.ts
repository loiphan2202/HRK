import { DataSource } from 'typeorm';
import 'reflect-metadata';
import { User } from '@/entities/User';
import { Category } from '@/entities/Category';
import { Product } from '@/entities/Product';
import { ProductCategory } from '@/entities/ProductCategory';
import { Table } from '@/entities/Table';
import { Order } from '@/entities/Order';
import { OrderProduct } from '@/entities/OrderProduct';

// MongoDB connection options for Heroku/Atlas
const getMongoOptions = () => {
  const url = process.env.DATABASE_URL || '';
  
  // For MongoDB Atlas (mongodb+srv://), TLS/SSL is required
  if (url.includes('mongodb+srv://')) {
    return {
      // SSL/TLS options for MongoDB Atlas
      tls: true,
      tlsAllowInvalidCertificates: false,
    };
  }
  
  // For local MongoDB, no SSL needed
  return {};
};

const dataSource = new DataSource({
  type: 'mongodb',
  url: process.env.DATABASE_URL,
  entities: [User, Category, Product, ProductCategory, Table, Order, OrderProduct],
  synchronize: false, // Don't auto-sync in production
  logging: process.env.NODE_ENV === 'development',
  ...getMongoOptions(),
});

export async function getDataSource(): Promise<DataSource> {
  // Ensure initialization
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  return dataSource;
}

// Singleton pattern for Next.js
// Don't initialize during build time to avoid MongoDB connection errors
const globalForTypeORM = globalThis as unknown as {
  dataSource: DataSource | undefined;
};

// Initialize DataSource asynchronously (non-blocking)
// This must be an async function to avoid blocking module initialization
async function initializeDataSource(): Promise<void> {
  try {
    await getDataSource();
  } catch (error) {
    // Only log if not a build-time error
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE !== 'phase-production-build') {
      console.error('Failed to initialize DataSource:', error);
    }
  }
}

// Only initialize if not in build phase
if (globalThis.window === undefined && process.env.NEXT_PHASE !== 'phase-production-build') {
  if (!globalForTypeORM.dataSource) {
    // Initialize asynchronously to avoid blocking build
    // Top-level await cannot be used here due to conditional initialization
    // Using void to explicitly ignore the promise (intentional fire-and-forget)
    void initializeDataSource();
  }
}

export { dataSource };
