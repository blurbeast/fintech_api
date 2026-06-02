import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     AmountDto:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: number
 *           minimum: 0
 *     TransferDto:
 *       type: object
 *       required:
 *         - recipient_email
 *         - amount
 *       properties:
 *         recipient_email:
 *           type: string
 *           format: email
 *         amount:
 *           type: number
 *           minimum: 0
 */

export const amountSchema = z.object({
  amount: z.number().positive(),
});

export const transferSchema = z.object({
  recipient_email: z.string().trim().email(),
  amount: z.number().positive(),
});

export type AmountDto = z.infer<typeof amountSchema>;
export type TransferDto = z.infer<typeof transferSchema>;
