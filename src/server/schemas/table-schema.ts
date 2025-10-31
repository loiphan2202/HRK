import { z } from 'zod';

export const tableStatusEnum = z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED']);

export const tableCreateSchema = z.object({
  number: z.number().int().positive(),
  status: tableStatusEnum.optional().default('AVAILABLE'),
});

export const tableUpdateSchema = z.object({
  number: z.number().int().positive().optional(),
  status: tableStatusEnum.optional(),
  token: z.string().optional(),
  qrCode: z.string().optional(),
});

export type TableCreate = z.infer<typeof tableCreateSchema>;
export type TableUpdate = z.infer<typeof tableUpdateSchema>;
export type TableStatus = z.infer<typeof tableStatusEnum>;

