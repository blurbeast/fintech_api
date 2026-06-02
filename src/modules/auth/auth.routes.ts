import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { registerSchema, loginSchema, refreshSchema } from './auth.dto';

const router = Router();

// set up
const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication
 */

router.post('/register', validateRequest(registerSchema), authController.register.bind(authController));
router.post('/login', validateRequest(loginSchema), authController.login.bind(authController));
router.post('/refresh', validateRequest(refreshSchema), authController.refresh.bind(authController));

export default router;
