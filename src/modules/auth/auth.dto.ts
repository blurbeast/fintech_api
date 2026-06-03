import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterDto:
 *       type: object
 *       required:
 *         - full_name
 *         - email
 *         - password
 *       properties:
 *         full_name:
 *           type: string
 *           minLength: 2
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *     LoginDto:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *     RefreshDto:
 *       type: object
 *       required:
 *         - refresh_token
 *       properties:
 *         refresh_token:
 *           type: string
 */

export const registerSchema = z.object({
  full_name: z.string().nonempty('full_name is required').min(2, 'full_name must be at least 2 characters long'),
  email: z.string().nonempty('email is required').lowercase().trim().email(),
  password: z.string().nonempty('password is required').min(6, 'password must be at least 6 characters long').regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{6,}$/, 'password must contain at least one number, one lowercase letter, one uppercase letter, and be at least 6 characters long'),
});

export const loginSchema = z.object({
  email: z.string().lowercase().trim().nonempty().email(),
  password: z.string().nonempty('password is required').nonoptional(),
});

export const refreshSchema = z.object({
  refresh_token: z.string().nonempty('refresh_token is required'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
