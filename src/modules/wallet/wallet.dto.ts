import { z } from 'zod';

export const amountSchema = z.object({
  amount: z.number().positive(),
});

export const transferSchema = z.object({
  recipient_email: z.string().email(),
  amount: z.number().positive(),
});

export type AmountDto = z.infer<typeof amountSchema>;
export type TransferDto = z.infer<typeof transferSchema>;
