import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Catch } from '../../shared/decorators/catch.decorator';
import { injectable, inject } from 'tsyringe';

@injectable()
export class AuthController {
  constructor(@inject(AuthService) private authService: AuthService) {}

  @Catch()
  async register(req: Request, res: Response) {
    const result = await this.authService.register(req.body);
    res.status(201).json(result);
  }

  @Catch()
  async login(req: Request, res: Response) {
    const result = await this.authService.login(req.body);
    res.status(200).json(result);
  }

  @Catch()
  async refresh(req: Request, res: Response) {
    const result = await this.authService.refresh(req.body.refresh_token);
    res.status(200).json(result);
  }
}
