import { Entity, ObjectIdColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Order } from './Order';

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
}

@Entity('tables')
export class Table {
  @ObjectIdColumn()
  id!: ObjectId;

  @Column({ unique: true })
  number!: number;

  @Column({ type: 'enum', enum: TableStatus, default: TableStatus.AVAILABLE })
  status!: TableStatus;

  @Column({ nullable: true, unique: true })
  token?: string;

  @Column({ nullable: true })
  qrCode?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  orders?: Order[];
}
