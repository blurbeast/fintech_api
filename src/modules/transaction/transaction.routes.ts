import { Router } from 'express';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TransactionRepository } from './transaction.repository';
import { WalletService } from '../wallet/wallet.service';
import { WalletRepository } from '../wallet/wallet.repository';
import { UserService } from '../user/user.service';
import { UserRepository } from '../user/user.repository';
import { authMiddleware } from '../../shared/middlewares/authMiddleware';
import { validateQuery } from '../../shared/middlewares/validateQuery';
import { transactionQuerySchema } from './transaction.dto';

const router = Router();

// set up
const transactionRepository = new TransactionRepository();

const walletRepository = new WalletRepository();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);

const walletService = new WalletService(walletRepository, userService);

const transactionService = new TransactionService(transactionRepository, walletService);
const transactionController = new TransactionController(transactionService);

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
router.get('/:id', transactionController.getTransactionById.bind(transactionController));

export default router;
