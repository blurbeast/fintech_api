import { AuthRepository } from './auth.repository';
import { RegisterDto, LoginDto } from './auth.dto';
import { env } from '../../config/env';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '@prisma/client';
import { UserService } from '../user/user.service';
import { injectable, singleton, inject } from 'tsyringe';

@injectable()
@singleton()
export class AuthService {
  constructor(
    @inject(AuthRepository) private authRepository: AuthRepository,
    @inject(UserService) private userService: UserService
  ) {}

  async register(data: RegisterDto) {
    const existingUser = await this.authRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await argon2.hash(data.password);

    const user = await this.authRepository.registerWithOutbox(data, hashedPassword);

    return {
      message: 'User registered successfully. Wallet creation is processing.',
      user: {
        id: user.id,
        email: user.email,
        created_at: user.createdAt,
      },
    };
  }

  async login(data: LoginDto) {
    const user = await this.authRepository.findByEmail(data.email);
    if (!user || !user.profile?.password) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await argon2.verify(user.profile.password, data.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = this.signToken(user);
    const refreshToken = await this.generateAndStoreRefreshToken(user.id);

    return {
      message: 'Login successful',
      token,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const session = await this.authRepository.findSessionByToken(refreshToken);
    if (!session) {
      throw new Error('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      await this.authRepository.deleteSession(session.id);
      throw new Error('Refresh token expired');
    }

    const user = await this.authRepository.findById(session.userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.authRepository.deleteSession(session.id);

    const token = this.signToken(user);
    const newRefreshToken = await this.generateAndStoreRefreshToken(user.id);

    return {
      message: 'Token refreshed successfully',
      token,
      refreshToken: newRefreshToken,
    };
  }

  private signToken(user: User) {
    const token = jwt.sign(
      {userId: user.id, email: user.email},
      env.JWT_SECRET,
      {expiresIn: env.JWT_EXPIRES_IN as any}
    );

    return token;
  }
    
  private async generateAndStoreRefreshToken(userId: string) {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    const expireStr = env.JWT_REFRESH_EXPIRE_IN;
    let msToAdd = 24 * 60 * 60 * 1000; // 1 day
    
    if (expireStr.endsWith('d')) {
      msToAdd = parseInt(expireStr) * 24 * 60 * 60 * 1000;
    } else if (expireStr.endsWith('h')) {
      msToAdd = parseInt(expireStr) * 60 * 60 * 1000;
    } else if (expireStr.endsWith('m')) {
      msToAdd = parseInt(expireStr) * 60 * 1000;
    } else if (!isNaN(parseInt(expireStr))) {
      msToAdd = parseInt(expireStr); // milliseconds
    }

    const expiresAt = new Date(Date.now() + msToAdd);
    await this.authRepository.createSession(userId, refreshToken, expiresAt);

    return refreshToken;
  }
}
