import { Router } from 'express';
import { container } from 'tsyringe';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { registerSchema, loginSchema, refreshSchema } from './auth.dto';

const router = Router();

const authController = container.resolve(AuthController);

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication operations
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterDto'
 *     responses:
 *       201:
 *         description: Successfully registered
 *       400:
 *         description: Validation Error
 */
router.post('/register', validateRequest(registerSchema), authController.register.bind(authController));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginDto'
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/login', validateRequest(loginSchema), authController.login.bind(authController));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshDto'
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', validateRequest(refreshSchema), authController.refresh.bind(authController));

export default router;
