import { Router } from 'express';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { authMiddleware } from '../../shared/middlewares/authMiddleware';

const router = Router();

// set up
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

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
