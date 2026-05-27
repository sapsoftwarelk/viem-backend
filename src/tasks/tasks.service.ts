import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  create(data: {
    title: string;
    description?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    status?: 'Active' | 'Inactive';
  }) {
    return this.prisma.task.create({
      data,
    });
  }

  findAll() {
    return this.prisma.task.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
    });
  }

  update(
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
      status?: 'Active' | 'Inactive';
    },
  ) {
    return this.prisma.task.update({
      where: { id },
      data,
    });
  }
}
