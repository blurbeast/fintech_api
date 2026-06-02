import { prisma } from '../../config/prisma';

export class UserRepository {
  async findByIdWithWalletAndProfile(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { 
        profile: true,
        wallet: true 
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { 
        profile: true, 
        wallet: true
      }
    });
  }
}
