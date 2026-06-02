import { Request, Response } from 'express';
import { WalletService } from './wallet.service';
import { amountSchema, transferSchema } from './wallet.dto';
import { AuthRequest } from '../../shared/middlewares/authMiddleware';
import { Catch } from '../../shared/decorators/catch.decorator';

export class WalletController {
  constructor(private walletService: WalletService) {}

  @Catch()
  async fund(req: AuthRequest, res: Response) {
    const userId = req.user!.userId;
    const { amount } = amountSchema.parse(req.body);

    const result = await this.walletService.fund(userId, amount);
    
    res.status(200).json({
      message: 'Wallet funded successfully',
      data: result,
    });
  }

  @Catch()
  async transfer(req: AuthRequest, res: Response) {
    const userId = req.user!.userId;
    const { recipient_email, amount } = transferSchema.parse(req.body);

    const result = await this.walletService.transfer(userId, recipient_email, amount);

    res.status(200).json(result);
  }

  @Catch()
  async withdraw(req: AuthRequest, res: Response) {
    const userId = req.user!.userId;
    const { amount } = amountSchema.parse(req.body);

    const result = await this.walletService.withdraw(userId, amount);

    res.status(200).json({
      message: 'Withdrawal successful',
      data: result,
    });
  }

  @Catch()
  async getTransactions(req: AuthRequest, res: Response) {
    const userId = req.user!.userId;
    const transactions = await this.walletService.getTransactions(userId);
    res.status(200).json(transactions);
  }
}
