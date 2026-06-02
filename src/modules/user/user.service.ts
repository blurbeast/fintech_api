import { UserRepository } from './user.repository';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getMe(userId: string) {
    const user = await this.userRepository.findByIdWithWalletAndProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}
