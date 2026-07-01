import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type SiteSubLevel = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  remarks: string;
};

export type CreateSiteLocationDto = {
  siteName: string;
  manager?: string;
  region?: string;
  status?: string;
  client?: string;
  contactNumber?: string;
  address?: string;
  startDate?: string | Date;
  remarks?: string;
  subLevels?: SiteSubLevel[];
};

export type UpdateSiteLocationDto = Partial<CreateSiteLocationDto> & {
  seq?: number;
};

@Injectable()
export class SiteLocationsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.siteLocation.findMany({
      include: {
        managerHistory: {
          orderBy: { fromDate: 'asc' },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const site = await this.prisma.siteLocation.findUnique({
      where: { id },
      include: {
        managerHistory: {
          orderBy: { fromDate: 'asc' },
        },
      },
    });
    if (!site) throw new NotFoundException('Site location not found');
    return site;
  }

  async create(data: CreateSiteLocationDto) {
    if (!data.siteName?.trim()) throw new BadRequestException('siteName is required');

    const region = this.inferRegion(data);
    const seq = await this.nextSequence(region);
    const id = this.generateSiteId(region, seq);

    const manager = data.manager?.trim() || '';
    const startDate = data.startDate ? this.parseDate(data.startDate, 'startDate') : undefined;

    return this.prisma.siteLocation.create({
      data: {
        id,
        siteName: data.siteName.trim(),
        manager,
        region,
        seq,
        status: data.status || 'Planning',
        client: data.client || '',
        contactNumber: data.contactNumber || '',
        address: data.address || '',
        startDate,
        remarks: data.remarks || '',
        subLevels: data.subLevels || [],
        managerHistory: manager
          ? {
              create: {
                manager,
                fromDate: startDate || new Date(),
                changedBy: 'System',
              },
            }
          : undefined,
      },
      include: {
        managerHistory: {
          orderBy: { fromDate: 'asc' },
        },
      },
    });
  }

  async update(id: string, data: UpdateSiteLocationDto) {
    const currentSite = await this.findOne(id);
    const nextManager =
      data.manager === undefined ? undefined : data.manager.trim();
    const managerChanged =
      nextManager !== undefined && nextManager !== currentSite.manager;

    return this.prisma.$transaction(async (tx) => {
      if (managerChanged) {
        const now = new Date();
        await tx.siteManagerHistory.updateMany({
          where: { siteId: id, toDate: null },
          data: { toDate: now },
        });

        if (nextManager) {
          await tx.siteManagerHistory.create({
            data: {
              siteId: id,
              manager: nextManager,
              fromDate: now,
              changedBy: 'Admin',
            },
          });
        }
      }

      return tx.siteLocation.update({
        where: { id },
        data: {
          siteName: data.siteName?.trim(),
          manager: nextManager,
          region: data.region?.trim(),
          seq: data.seq,
          status: data.status,
          client: data.client,
          contactNumber: data.contactNumber,
          address: data.address,
          startDate: data.startDate ? this.parseDate(data.startDate, 'startDate') : undefined,
          remarks: data.remarks,
          subLevels: data.subLevels,
        },
        include: {
          managerHistory: {
            orderBy: { fromDate: 'asc' },
          },
        },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.siteLocation.delete({ where: { id } });
  }

  private inferRegion(data: CreateSiteLocationDto): string {
    const candidates = [data.region, data.address, data.siteName, 'General']
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean);

    return candidates[0] || 'General';
  }

  private async nextSequence(region: string): Promise<number> {
    const latest = await this.prisma.siteLocation.findFirst({
      where: { region },
      orderBy: { seq: 'desc' },
      select: { seq: true },
    });
    return (latest?.seq || 0) + 1;
  }

  private generateSiteId(region: string, seq: number): string {
    const code = this.regionCode(region);
    return `SITE-${code}-${String(seq).padStart(4, '0')}`;
  }

  private regionCode(region: string): string {
    return region
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 3)
      .padEnd(3, 'X');
  }

  private parseDate(value: Date | string, field: string): Date {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid date`);
    }
    return date;
  }
}
