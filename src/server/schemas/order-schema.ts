import { z } from 'zod';

export const orderStatusEnum = z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']);

export const orderProductSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

export const orderCreateSchema = z.object({
  userId: z.string().optional(),
  tableId: z.string().optional(),
  tableNumber: z.number().int().positive().optional(),
  tableToken: z.string().optional(), // Token for table validation
  products: z.array(orderProductSchema),
});

export const orderUpdateSchema = z.object({
  status: orderStatusEnum.optional(),
});

export type OrderCreate = z.infer<typeof orderCreateSchema>;
export type OrderUpdate = z.infer<typeof orderUpdateSchema>;
export type OrderProduct = z.infer<typeof orderProductSchema>;
export type OrderStatus = z.infer<typeof orderStatusEnum>;