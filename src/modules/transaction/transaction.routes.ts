import { Router } from 'express';
import { container } from 'tsyringe';
import { TransactionController } from './transaction.controller';
import { authMiddleware } from '../../shared/middlewares/authMiddleware';
import { validateQuery } from '../../shared/middlewares/validateQuery';
import { validateParams } from '../../shared/middlewares/validateParams';
import { transactionQuerySchema, transactionIdSchema } from './transaction.dto';

const router = Router();

const transactionController = container.resolve(TransactionController);

// route requires authentication
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Transaction
 *   description: Transaction ledger history
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get user transaction history
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: walletId
 *         schema:
 *           type: string
 *         description: Filter by wallet ID
 *     responses:
 *       200:
 *         description: List of transactions
 *       401:
 *         description: Unauthorized
 */
router.get('/', validateQuery(transactionQuerySchema), transactionController.getTransactions.bind(transactionController));

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', validateParams(transactionIdSchema), transactionController.getTransactionById.bind(transactionController));

export default router;
