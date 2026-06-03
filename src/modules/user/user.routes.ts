import { Router } from 'express';
import { container } from 'tsyringe';
import { UserController } from './user.controller';
import { authMiddleware } from '../../shared/middlewares/authMiddleware';

const router = Router();

const userController = container.resolve(UserController);

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User profile and details
 */

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get current logged-in user details
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile and wallet retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authMiddleware, userController.getMe.bind(userController));

export default router;
