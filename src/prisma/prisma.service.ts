import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { URL } from 'node:url';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(connectionString);
    } catch (error) {
      throw new Error(`DATABASE_URL is not a valid URL: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!parsedUrl.password) {
      throw new Error('DATABASE_URL must include a password');
    }

    const adapter = new PrismaPg(connectionString);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
