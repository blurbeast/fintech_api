import { z } from 'zod';

export const transactionQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 10)),
  userId: z.string().optional(),
  walletId: z.string().optional(),
});
