import { prisma } from '../../config/prisma';
import { RegisterDto } from './auth.dto';
import { injectable, singleton } from 'tsyringe';

@injectable()
@singleton()
export class AuthRepository {
  async registerWithOutbox(data: RegisterDto, passwordHash: string) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          profile: {
            create: {
              fullName: data.full_name,
              password: passwordHash,
            },
          },
        },
      });

      await tx.outboxEvent.create({
        data: {
          topic: 'USER_CREATED',
          payload: { userId: user.id },
          status: 'PENDING',
        },
      });

      return user;
    },);
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async createSession(userId: string, refreshToken: string, expiresAt: Date) {
    return prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
      },
    });
  }

  async findSessionByToken(refreshToken: string) {
    return prisma.session.findUnique({
      where: { refreshToken },
    });
  }

  async deleteSession(id: string) {
    return prisma.session.delete({
      where: { id },
    });
  }
}
