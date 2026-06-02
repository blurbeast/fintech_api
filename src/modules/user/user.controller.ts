import { Request, Response } from 'express';
import { UserService } from './user.service';
import { AuthRequest } from '../../shared/middlewares/authMiddleware';
import { Catch } from '../../shared/decorators/catch.decorator';

export class UserController {
  constructor(private userService: UserService) {}

  @Catch()
  async getMe(req: AuthRequest, res: Response) {
    const userId = req.user!.userId;
    const user = await this.userService.getMe(userId);
    
    const { password, ...other } = user.profile || { password: '' };

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.createdAt,
      },
      profile: other,
      wallet: user.wallet,
    });
  }
}
