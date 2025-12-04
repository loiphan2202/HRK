import { DataSource } from 'typeorm';
import 'reflect-metadata';
import { User } from '@/entities/User';
import { Category } from '@/entities/Category';
import { Product } from '@/entities/Product';
import { ProductCategory } from '@/entities/ProductCategory';
import { Table } from '@/entities/Table';
import { Order } from '@/entities/Order';
import { OrderProduct } from '@/entities/OrderProduct';

const dataSource = new DataSource({
  type: 'mongodb',
  url: process.env.DATABASE_URL,
  entities: [User, Category, Product, ProductCategory, Table, Order, OrderProduct],
  synchronize: false, // Don't auto-sync in production
  logging: process.env.NODE_ENV === 'development',
});

export async function getDataSource(): Promise<DataSource> {
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
  try {
    globalForTypeORM.dataSource = await getDataSource();
  } catch (error) {
    console.error(error);
  }
}

export { dataSource };
