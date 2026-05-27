import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // AUTO SUPER ADMIN INIT
  // =========================
  async onModuleInit() {
    await this.createSuperAdminIfNotExists();
  }

  private async createSuperAdminIfNotExists() {
    const existing = await this.prisma.user.findUnique({
      where: { username: 'superadmin' },
    });

    if (existing) return;

    console.log('🌱 Creating Super Admin...');

    const employee = await this.prisma.employee.upsert({
      where: { id: 'EMP-SUPER-001' },
      update: {},
      create: {
        id: 'EMP-SUPER-001',
        name: 'Super Admin',
        employeeId: 'SUPER-ADMIN',
        contact: '0000000000',
        department: 'ADMIN',
      },
    });

    const role = await this.prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: {
        name: 'SUPER_ADMIN',
        canCreateUsers: true,
        canRaisePO: true,
        canConfirmDeliveries: true,
        canRunAudits: true,
        canLogMachineHours: true,
      },
    });

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await this.prisma.user.create({
      data: {
        username: 'superadmin',
        password: hashedPassword,
        employeeId: employee.id, // ✅ Use employee.id (the actual ID)
        roleId: role.id,
      },
    });

    console.log('✅ Super Admin created successfully');
  }

  // =========================
  // GET ALL USERS
  // =========================
  findAll() {
    return this.prisma.user.findMany({
      include: {
        employee: true,
        role: true,
      },
    });
  }

  // =========================
  // GET ONE USER
  // =========================
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        employee: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // =========================
  // CREATE USER
  // =========================
  async create(data: {
    username: string;
    password: string;
    employeeId: string;
    roleId: string;
    isActive?: boolean;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        employeeId: data.employeeId,
        roleId: data.roleId,
        isActive: data.isActive ?? true,
      },
      include: {
        // ✅ Add this to return related data
        employee: true,
        role: true,
      },
    });
  }

  // =========================
  // UPDATE USER
  // =========================
  async update(
    id: string,
    data: {
      username?: string;
      password?: string;
      roleId?: string;
      isActive?: boolean;
    },
  ) {
    const updateData: any = { ...data };

    // if password is updated → hash it
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        // ✅ Add this to return related data
        employee: true,
        role: true,
      },
    });
  }

  // =========================
  // DELETE USER
  // =========================
  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
