import { UserRepository } from './user.repository';
import { injectable, singleton, inject } from 'tsyringe';

@injectable()
@singleton()
export class UserService {
  constructor(@inject(UserRepository) private userRepository: UserRepository) {}

  async getMe(userId: string) {
    const user = await this.userRepository.findByIdWithWalletAndProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const { password, ...other } = user.profile || { password: '' };

    return {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.createdAt,
      },
      profile: other,
      wallet: user.wallet,
    };
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}
