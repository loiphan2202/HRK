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
      // Connection pool settings for better reliability on Heroku
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
    };
  }

  // For local MongoDB, basic pool settings
  return {
    maxPoolSize: 10,
    minPoolSize: 2,
  };
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
    try {
      console.log('Initializing database connection...');
      console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

      // Add connection timeout for better error handling on Heroku
      const connectionTimeout = setTimeout(() => {
        console.error('Database connection timeout after 30 seconds');
      }, 30000);

      await dataSource.initialize();
      clearTimeout(connectionTimeout);

      console.log('Database connection successful');
    } catch (error) {
      console.error('Failed to initialize DataSource:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        databaseUrl: process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set'
      });

      throw new Error(
        `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        `Please check DATABASE_URL environment variable and ensure MongoDB is accessible.`
      );
    }
  }

  return dataSource;
}

// Singleton pattern for Next.js
// Don't initialize during build time to avoid MongoDB connection errors
const globalForTypeORM = globalThis as unknown as {
  dataSource: DataSource | undefined;
};

// Lazy initialization - don't block module loading
// Initialize DataSource on first use, not at module load time
// This prevents 503 errors if database is temporarily unavailable
// Note: Using promise chain instead of top-level await to avoid blocking server startup
if (globalThis.window === undefined && process.env.NEXT_PHASE !== 'phase-production-build') {
  if (!globalForTypeORM.dataSource) {
    // Initialize asynchronously without blocking (fire-and-forget)
    // This allows the server to start even if DB connection fails initially
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getDataSource().catch((error) => {
      // Only log if not a build-time error
      if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE !== 'phase-production-build') {
        console.error('Failed to initialize DataSource:', error);
      }
    });
  }
}

export { dataSource };
