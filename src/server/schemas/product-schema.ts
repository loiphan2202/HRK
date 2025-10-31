import { z } from 'zod';

export const productCreateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  image: z.string().optional(),
  categoryId: z.string(), // Category ID
});

export const productUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  image: z.string().optional(),
  categoryId: z.string().optional(),
});

export type ProductCreate = z.infer<typeof productCreateSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;