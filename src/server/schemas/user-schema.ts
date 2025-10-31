import { z } from 'zod';

export const userRoleEnum = z.enum(['CUSTOMER', 'ADMIN']);

export const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(6),
  role: userRoleEnum.optional().default('CUSTOMER'),
});

export const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  password: z.string().min(6).optional(),
  image: z.string().optional(),
  role: userRoleEnum.optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type Login = z.infer<typeof loginSchema>;