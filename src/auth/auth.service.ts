import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { username },
      include: { role: true }
    });
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _pwd, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        employeeId: user.employeeId,
        role: user.role,
      },
    };
  }

  async register(username: string, password: string, employeeId: string, roleId: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { employeeId },
        ],
      },
      select: { username: true, employeeId: true },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('Username already exists');
      }
      if (existingUser.employeeId === employeeId) {
        throw new ConflictException('Employee already has a user account');
      }
      throw new ConflictException('User already exists');
    }

    // Validate that the role exists
    const roleExists = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!roleExists) {
      throw new ConflictException('Role does not exist');
    }

    // Validate that the employee exists
    const employeeExists = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employeeExists) {
      throw new ConflictException('Employee does not exist');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          employeeId,
          roleId,
        },
        include: { role: true }
      });

      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes('username')) {
          throw new ConflictException('Username already exists');
        }
        if (target?.includes('employeeId')) {
          throw new ConflictException('Employee already has a user account');
        }
      }
      throw error;
    }
  }
}
