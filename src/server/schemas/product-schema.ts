import { z } from 'zod';

export const productCreateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(-1).nullable().optional(), // -1 = unlimited, null = no stock tracking
  image: z.string().optional(),
  categoryIds: z.array(z.string()).optional().default([]), // Array of Category IDs - optional
});

export const productUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(-1).nullable().optional(), // -1 = unlimited, null = no stock tracking
  image: z.string().optional(),
  categoryIds: z.array(z.string()).optional(), // Array of Category IDs - optional
});

export type ProductCreate = z.infer<typeof productCreateSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;