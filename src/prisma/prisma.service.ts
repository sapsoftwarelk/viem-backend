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
    // Backfill roles: copy `name` to `position_title` when empty.
    try {
      if (!(await this.columnExists('role', 'position_title'))) {
        // Skip backfill if the database schema has not been migrated yet.
        // This is expected when the application is running against an older DB.
        // eslint-disable-next-line no-console
        console.warn('Role backfill skipped: database does not contain role.position_title');
        return;
      }

      const roles = await this.role.findMany();
      for (const r of roles) {
        if ((!r.position_title || r.position_title === '') && (r as any).name) {
          await this.role.update({ where: { id: r.id }, data: { position_title: (r as any).name } });
        }
      }
    } catch (e) {
      // Ignore errors during backfill to avoid blocking startup in dev environments
      // Log for visibility
      // eslint-disable-next-line no-console
      console.warn('Role backfill skipped or failed:', e?.message ?? e);
    }
  }

  private async columnExists(table: string, column: string): Promise<boolean> {
    const result = await this.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE lower(table_name) = lower(${table})
        AND lower(column_name) = lower(${column})
    `;
    return result.length > 0;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
