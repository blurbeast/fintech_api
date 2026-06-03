import { Response } from 'express';
import { TransactionService } from './transaction.service';
import { AuthRequest } from '../../shared/middlewares/authMiddleware';
import { Catch } from '../../shared/decorators/catch.decorator';
import { injectable, inject } from 'tsyringe';

@injectable()
export class TransactionController {
  constructor(@inject(TransactionService) private transactionService: TransactionService) {}

  @Catch()
  async getTransactions(req: AuthRequest, res: Response) {
    const { page, limit, userId, walletId } = req.query as any;

    const targetUserId = userId || (!walletId ? req.user!.userId : undefined);
    
    const result = await this.transactionService.getTransactions(
      { userId: targetUserId, walletId },
      page,
      limit
    );
    res.status(200).json(result);
  }

  @Catch()
  async getTransactionById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const transaction = await this.transactionService.getTransactionById(id as string, req.user!.userId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.status(200).json(transaction);
  }
}
