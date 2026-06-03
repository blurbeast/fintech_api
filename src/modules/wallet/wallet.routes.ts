import { Router } from 'express';
import { container } from 'tsyringe';
import { WalletController } from './wallet.controller';
import { authMiddleware } from '../../shared/middlewares/authMiddleware';
import { idempotencyMiddleware } from '../idempotency/idempotency.middleware';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { amountSchema, transferSchema } from './wallet.dto';

const router = Router();

const walletController = container.resolve(WalletController);

// require auth for all wallet routes
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet operations
 */

/**
 * @swagger
 * /api/wallet/fund:
 *   post:
 *     summary: Fund user wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique key to prevent duplicate funding
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
 *                 minimum: 0.01
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/fund',
  idempotencyMiddleware('FUND_WALLET'),
  validateRequest(amountSchema),
  walletController.fund.bind(walletController)
);

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
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique key to prevent duplicate transfers
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
 *                 minimum: 0.01
 *     responses:
 *       200:
 *         description: Transfer successful
 *       400:
 *         description: Insufficient balance or invalid input
 *       404:
 *         description: Recipient not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/transfer',
  idempotencyMiddleware('TRANSFER'),
  validateRequest(transferSchema),
  walletController.transfer.bind(walletController)
);

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
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique key to prevent duplicate withdrawals
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
 *                 minimum: 0.01
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Insufficient balance
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/withdraw',
  idempotencyMiddleware('WITHDRAW'),
  validateRequest(amountSchema),
  walletController.withdraw.bind(walletController)
);

export default router;
