import { z } from 'zod';

export const categoryCreateSchema = z.object({
  name: z.string().min(1),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
});

export type CategoryCreate = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;

