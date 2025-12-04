import { Entity, ObjectIdColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';
import { User } from './User';
import { Table } from './Table';
import { OrderProduct } from './OrderProduct';

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('orders')
export class Order {
  @ObjectIdColumn()
  id!: ObjectId;

  @Column({ nullable: true })
  userId?: ObjectId;

  @Column({ nullable: true })
  tableId?: ObjectId;

  @Column({ type: 'int', nullable: true })
  tableNumber?: number;

  @Column({ type: 'float' })
  total!: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt?: Date;

  // Relations
  user?: User;
  table?: Table;
  products?: OrderProduct[];
}
