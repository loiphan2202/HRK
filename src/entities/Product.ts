import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('products')
export class Product {
  @ObjectIdColumn()
  id!: ObjectId;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ type: 'float' })
  price!: number;

  @Column({ type: 'int', nullable: true })
  stock?: number | null; // null = no stock tracking, -1 = unlimited, >=0 = actual stock

  // Relations
  categories?: any[]; // ProductCategory[]
  orderProducts?: any[]; // OrderProduct[]
}
