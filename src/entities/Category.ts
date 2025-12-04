import { Entity, ObjectIdColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';
import { ProductCategory } from './ProductCategory';

@Entity('categories')
export class Category {
  @ObjectIdColumn()
  id!: ObjectId;

  @Column({ unique: true })
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  products?: ProductCategory[];
}
