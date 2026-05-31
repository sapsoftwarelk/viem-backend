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
  region: string;
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
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const site = await this.prisma.siteLocation.findUnique({ where: { id } });
    if (!site) throw new NotFoundException('Site location not found');
    return site;
  }

  async create(data: CreateSiteLocationDto) {
    if (!data.siteName?.trim()) throw new BadRequestException('siteName is required');
    if (!data.region?.trim()) throw new BadRequestException('region is required');

    const region = data.region.trim();
    const seq = await this.nextSequence(region);
    const id = this.generateSiteId(region, seq);

    return this.prisma.siteLocation.create({
      data: {
        id,
        siteName: data.siteName.trim(),
        region,
        seq,
        status: data.status || 'Planning',
        client: data.client || '',
        contactNumber: data.contactNumber || '',
        address: data.address || '',
        startDate: data.startDate ? this.parseDate(data.startDate, 'startDate') : undefined,
        remarks: data.remarks || '',
        subLevels: data.subLevels || [],
      },
    });
  }

  async update(id: string, data: UpdateSiteLocationDto) {
    await this.findOne(id);

    return this.prisma.siteLocation.update({
      where: { id },
      data: {
        siteName: data.siteName?.trim(),
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
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.siteLocation.delete({ where: { id } });
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
