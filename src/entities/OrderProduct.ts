import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Order } from './Order';
import { Product } from './Product';

@Entity('order_products')
export class OrderProduct {
  @ObjectIdColumn()
  id!: ObjectId;

  @Column()
  orderId!: ObjectId;

  @Column()
  productId!: ObjectId;

  @Column({ type: 'int' })
  quantity!: number;

  // Relations
  order?: Order;
  product?: Product;
}
