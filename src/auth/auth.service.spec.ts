import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findFirst: jest.Mock; findUnique: jest.Mock; create: jest.Mock } };
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };

    service = new AuthService(prisma as unknown as PrismaService, jwtService as unknown as JwtService);
  });

  it('returns a frontend-friendly login payload with token aliases', async () => {
    const result = await service.login({
      id: 'user-1',
      username: 'admin',
      employeeId: 'emp-1',
      role: { id: 'role-1', name: 'Admin' },
    });

    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-1', username: 'admin' });
    expect(result).toEqual(
      expect.objectContaining({
        access_token: 'signed-token',
        token: 'signed-token',
        accessToken: 'signed-token',
        message: 'Login successful',
        user: expect.objectContaining({
          id: 'user-1',
          username: 'admin',
          employeeId: 'emp-1',
          role: { id: 'role-1', name: 'Admin' },
        }),
      }),
    );
  });
});
