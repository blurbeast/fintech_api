import { AuthRepository } from './auth.repository';
import { RegisterDto, LoginDto } from './auth.dto';
import { env } from '../../config/env';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../../../generated/prisma/client';

export class AuthService {
  constructor(private authRepository: AuthRepository) {}

  async register(data: RegisterDto) {
    const existingUser = await this.authRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await argon2.hash(data.password);

    const user = await this.authRepository.registerWithOutbox(data, hashedPassword);

    return user;
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

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.authRepository.createSession(user.id, refreshToken, expiresAt);

    return { token, refreshToken, userId: user.id };
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

    // Invalidate old session
    await this.authRepository.deleteSession(session.id);

    // Issue new tokens
    const token = this.signToken(user);

    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.authRepository.createSession(user.id, newRefreshToken, expiresAt);

    return { token, refreshToken: newRefreshToken };
  }

  private async signToken(user: User) {
    const token = jwt.sign(
      {userId: user.id, email: user.email},
      env.JWT_SECRET,
      {expiresIn: env.JWT_EXPIRES_IN as any}
    );

    return token;
  }
    
}
