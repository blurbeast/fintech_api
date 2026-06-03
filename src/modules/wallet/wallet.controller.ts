import { Request, Response } from 'express';
import { WalletService } from './wallet.service';
import { AuthRequest } from '../../shared/middlewares/authMiddleware';
import { Catch } from '../../shared/decorators/catch.decorator';
import { injectable, inject } from 'tsyringe';

@injectable()
export class WalletController {
  constructor(@inject(WalletService) private walletService: WalletService) {}

  @Catch()
  async fund(req: AuthRequest, res: Response) {
    const userId = req.user!.userId;
    const { amount } = req.body;

    const result = await this.walletService.fund(userId, amount);
    res.status(200).json(result);
  }

  @Catch()
  async transfer(req: AuthRequest, res: Response) {
    const userId = req.user!.userId;
    const { recipient_email, amount } = req.body;

    const result = await this.walletService.transfer(userId, recipient_email, amount);
    res.status(200).json(result);
  }

  @Catch()
  async withdraw(req: AuthRequest, res: Response) {
    const userId = req.user!.userId;
    const { amount } = req.body;

    const result = await this.walletService.withdraw(userId, amount);
    res.status(200).json(result);
  }
}
