import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import walletRoutes from '../modules/wallet/wallet.routes';
import transactionRoutes from '../modules/transaction/transaction.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/user', userRoutes);
apiRouter.use('/wallet', walletRoutes);
apiRouter.use('/transactions', transactionRoutes);

export default apiRouter;
