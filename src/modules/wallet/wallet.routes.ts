import { Router } from 'express';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletRepository } from './wallet.repository';
import { TransactionRepository } from '../transaction/transaction.repository';
import { UserRepository } from '../user/user.repository';
import { authMiddleware } from '../../shared/middlewares/authMiddleware';
import { idempotencyMiddleware } from '../idempotency/idempotency.middleware';

const router = Router();

//set up
const walletRepository = new WalletRepository();
const transactionRepository = new TransactionRepository();
const userRepository = new UserRepository();

const walletService = new WalletService(walletRepository, transactionRepository, userRepository);
const walletController = new WalletController(walletService);

// All routes require auth
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet management
 */

router.post('/fund', idempotencyMiddleware('FUND_WALLET'), walletController.fund.bind(walletController));
router.post('/transfer', idempotencyMiddleware('TRANSFER'), walletController.transfer.bind(walletController));
router.post('/withdraw', idempotencyMiddleware('WITHDRAW'), walletController.withdraw.bind(walletController));
router.get('/transactions', walletController.getTransactions.bind(walletController));

export default router;
