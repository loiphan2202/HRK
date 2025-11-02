import { DataSource } from 'typeorm';
import 'reflect-metadata';
import { User } from '@/entities/User';
import { Category } from '@/entities/Category';
import { Product } from '@/entities/Product';
import { ProductCategory } from '@/entities/ProductCategory';
import { Table } from '@/entities/Table';
import { Order } from '@/entities/Order';
import { OrderProduct } from '@/entities/OrderProduct';

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  // Create new DataSource if not exists or not initialized
  dataSource ??= new DataSource({
    type: 'mongodb',
    url: databaseUrl,
    entities: [User, Category, Product, ProductCategory, Table, Order, OrderProduct],
    synchronize: false, // Don't auto-sync in production
    logging: process.env.NODE_ENV === 'development',
  });

  // Ensure initialization
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  return dataSource;
}

// Singleton pattern for Next.js
const globalForTypeORM = globalThis as unknown as {
  dataSource: DataSource | undefined;
};

if (!globalForTypeORM.dataSource) {
  getDataSource().then((ds) => {
    globalForTypeORM.dataSource = ds;
  }).catch(console.error);
}

export { dataSource };
