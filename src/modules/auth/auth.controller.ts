import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Catch } from '../../shared/decorators/catch.decorator';
import { injectable, inject } from 'tsyringe';

@injectable()
export class AuthController {
  constructor(@inject(AuthService) private authService: AuthService) {}

  @Catch()
  async register(req: Request, res: Response) {
    const data = req.body;
    const user = await this.authService.register(data);
    
    res.status(201).json({
      message: 'User registered successfully. Wallet creation is processing.',
      user: {
        id: user.id,
        email: user.email,
        created_at: user.createdAt,
      },
    });
  }

  @Catch()
  async login(req: Request, res: Response) {
    const data = req.body;
    const result = await this.authService.login(data);
    
    res.status(200).json({
      message: 'Login successful',
      token: result.token,
      refreshToken: result.refreshToken,
    });
  }

  @Catch()
  async refresh(req: Request, res: Response) {
    const data = req.body;
    const result = await this.authService.refresh(data.refresh_token);

    res.status(200).json({
      message: 'Token refreshed successfully',
      token: result.token,
      refreshToken: result.refreshToken,
    });
  }
}
