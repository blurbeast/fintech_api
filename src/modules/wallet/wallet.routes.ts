import { Router } from 'express';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletRepository } from './wallet.repository';
import { UserRepository } from '../user/user.repository';
import { UserService } from '../user/user.service';
import { authMiddleware } from '../../shared/middlewares/authMiddleware';
import { idempotencyMiddleware } from '../idempotency/idempotency.middleware';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { amountSchema, transferSchema } from './wallet.dto';

const router = Router();

// set up
const walletRepository = new WalletRepository();
const userRepository = new UserRepository();

const userService = new UserService(userRepository);

const walletService = new WalletService(walletRepository, userService);
const walletController = new WalletController(walletService);

// route requires authentication
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet management
 */

/**
 * @swagger
 * /api/wallet/fund:
 *   post:
 *     summary: Fund wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: false
 *         schema:
 *           type: string
 *         description: Unique key to prevent duplicate funding requests
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Wallet funded
 *       401:
 *         description: Unauthorized
 */
router.post('/fund', validateRequest(amountSchema), idempotencyMiddleware('FUND_WALLET'), walletController.fund.bind(walletController));

/**
 * @swagger
 * /api/wallet/transfer:
 *   post:
 *     summary: Transfer funds to another user
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: false
 *         schema:
 *           type: string
 *         description: Unique key to prevent duplicate transfer requests
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipient_email
 *               - amount
 *             properties:
 *               recipient_email:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Transfer successful
 *       400:
 *         description: Insufficient funds or invalid recipient
 *       401:
 *         description: Unauthorized
 */
router.post('/transfer', validateRequest(transferSchema), idempotencyMiddleware('TRANSFER'), walletController.transfer.bind(walletController));

/**
 * @swagger
 * /api/wallet/withdraw:
 *   post:
 *     summary: Withdraw funds from wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: false
 *         schema:
 *           type: string
 *         description: Unique key to prevent duplicate withdrawal requests
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Insufficient funds
 *       401:
 *         description: Unauthorized
 */
router.post('/withdraw', validateRequest(amountSchema), idempotencyMiddleware('WITHDRAW'), walletController.withdraw.bind(walletController));

export default router;
