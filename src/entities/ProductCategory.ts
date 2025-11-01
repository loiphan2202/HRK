import { Entity, ObjectIdColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('product_categories')
@Index(['productId', 'categoryId'], { unique: true })
export class ProductCategory {
  @ObjectIdColumn()
  id!: ObjectId;

  @Column()
  @Index()
  productId!: ObjectId;

  @Column()
  @Index()
  categoryId!: ObjectId;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  product?: any; // Product
  category?: any; // Category
}
