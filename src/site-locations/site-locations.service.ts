import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';

export type ManagerHistoryEntry = {
  managerName: string;
  changedAt: string;
};

export type AssignedPerson = {
  id?: string;
  name: string;
};

export type AssignedVehicle = {
  id?: string;
  vehiclePlate?: string;
  driver?: string;
};

export type SiteSubLevel = {
  id: string;
  name: string;
  manager: string;
  managerHistory: ManagerHistoryEntry[];
  region: string;
  seq: number;
  status: string;
  client: string;
  contactNumber: string;
  address: string;
  startDate: string;
  remarks: string;
  assignedPersons?: AssignedPerson[];
  assignedVehicles?: AssignedVehicle[];
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
  subLevels?: Partial<SiteSubLevel>[];
};

export type UpdateSiteLocationDto = Partial<CreateSiteLocationDto> & {
  seq?: number;
};

type PersonAssignment = {
  locationId: string;
  subLevelId?: string;
  persons: { id?: string; name: string }[];
};

type VehicleAssignment = {
  locationId: string;
  subLevelId?: string;
  vehicles: { id?: string; vehiclePlate?: string; driver?: string }[];
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

  /** Bulk-assign people to site sub-levels. Returns the updated sites. If callers
   * want a PDF, the controller handles generating a PDF from the returned data.
   */
  async assignPeopleBulk(assignments: PersonAssignment[]) {
    if (!Array.isArray(assignments) || assignments.length === 0) return { updated: 0 };

    return this.prisma.$transaction(async (tx) => {
      const updated: any[] = [];
      for (const a of assignments) {
        console.log('[service.assignPeopleBulk] processing assignment', { locationId: a.locationId, subLevelId: a.subLevelId, personsCount: Array.isArray(a.persons) ? a.persons.length : 0 });
        const site = await tx.siteLocation.findUnique({ where: { id: a.locationId } });
        if (!site) continue;
        const subLevels = Array.isArray(site.subLevels) ? site.subLevels : [];
        const next = subLevels.map((sl: any) => {
          if (!a.subLevelId || sl.id === a.subLevelId) {
            return { ...sl, assignedPersons: a.persons };
          }
          return sl;
        });
        const saved = await tx.siteLocation.update({ where: { id: a.locationId }, data: { subLevels: next as any } });
        console.log('[service.assignPeopleBulk] saved site', saved.id);
        updated.push(saved);
      }
      return { updated: updated.length, sites: updated };
    });
  }

  async assignVehiclesBulk(assignments: VehicleAssignment[]) {
    if (!Array.isArray(assignments) || assignments.length === 0) return { updated: 0 };

    return this.prisma.$transaction(async (tx) => {
      const updated: any[] = [];
      for (const a of assignments) {
        console.log('[service.assignVehiclesBulk] processing assignment', { locationId: a.locationId, subLevelId: a.subLevelId, vehiclesCount: Array.isArray(a.vehicles) ? a.vehicles.length : 0 });
        const site = await tx.siteLocation.findUnique({ where: { id: a.locationId } });
        if (!site) continue;
        const subLevels = Array.isArray(site.subLevels) ? site.subLevels : [];
        const next = subLevels.map((sl: any) => {
          if (!a.subLevelId || sl.id === a.subLevelId) {
            return { ...sl, assignedVehicles: a.vehicles };
          }
          return sl;
        });
        const saved = await tx.siteLocation.update({ where: { id: a.locationId }, data: { subLevels: next as any } });
        console.log('[service.assignVehiclesBulk] saved site', saved.id);
        updated.push(saved);
      }
      return { updated: updated.length, sites: updated };
    });
  }

  async generatePeoplePdf(assignments: PersonAssignment[]) {
    const doc = new PDFDocument({ margin: 40 });
    doc.fontSize(18).text('Site People Assignments', { align: 'center' });
    doc.moveDown(1);
    for (const a of assignments) {
      doc.fontSize(12).text(`Location: ${a.locationId}`);
      if (a.subLevelId) doc.text(`Sub-level: ${a.subLevelId}`);
      doc.moveDown(0.3);
      if (Array.isArray(a.persons) && a.persons.length) {
        a.persons.forEach((p, idx) => {
          doc.fontSize(10).text(`${idx + 1}. ${p.name}${p.id ? ` (${p.id})` : ''}`);
        });
      } else {
        doc.fontSize(10).text('No persons assigned');
      }
      doc.moveDown(0.8);
    }
    doc.end();
    const buffer = await this.streamToBuffer(doc as any);
    return buffer;
  }

  async generateVehiclesPdf(assignments: VehicleAssignment[]) {
    const doc = new PDFDocument({ margin: 40 });
    doc.fontSize(18).text('Site Vehicle Assignments', { align: 'center' });
    doc.moveDown(1);
    for (const a of assignments) {
      doc.fontSize(12).text(`Location: ${a.locationId}`);
      if (a.subLevelId) doc.text(`Sub-level: ${a.subLevelId}`);
      doc.moveDown(0.3);
      if (Array.isArray(a.vehicles) && a.vehicles.length) {
        a.vehicles.forEach((v, idx) => {
          doc.fontSize(10).text(`${idx + 1}. ${v.vehiclePlate || v.id || 'Unknown'}${v.driver ? ` — ${v.driver}` : ''}`);
        });
      } else {
        doc.fontSize(10).text('No vehicles assigned');
      }
      doc.moveDown(0.8);
    }
    doc.end();
    const buffer = await this.streamToBuffer(doc as any);
    return buffer;
  }

  // ─────────────────────────────────────────────────────────────
  // Detailed reports (PDF) — full dump of a location's sites,
  // manager history, and assignments. Used for "Download Report"
  // on a single location, and "Download All" for every location.
  // ─────────────────────────────────────────────────────────────

  async generateLocationReportPdf(id: string): Promise<Buffer> {
    const location = await this.findOne(id);
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    this.writeLocationReport(doc, location);
    this.writePageNumbers(doc);
    doc.end();
    return this.streamToBuffer(doc as any);
  }

  async generateAllLocationsReportPdf(): Promise<Buffer> {
    const locations = await this.findAll();
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

    // Cover page
    doc.fontSize(22).fillColor('#0f172a').text('Site Locations — Full Report', { align: 'center' });
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .fillColor('#64748b')
      .text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1.5);

    const totalSites = locations.reduce(
      (sum: number, l: any) => sum + (Array.isArray(l.subLevels) ? l.subLevels.length : 0),
      0,
    );
    doc.fontSize(12).fillColor('#334155').text(`Total Locations: ${locations.length}`);
    doc.text(`Total Sites: ${totalSites}`);
    doc.moveDown(1);

    doc.fontSize(13).fillColor('#0f172a').text('Locations Index', { underline: true });
    doc.moveDown(0.5);
    locations.forEach((l: any) => {
      const siteCount = Array.isArray(l.subLevels) ? l.subLevels.length : 0;
      doc
        .fontSize(10)
        .fillColor('#334155')
        .text(`${l.id}   —   ${l.siteName || l.name || 'Unnamed'}   (${siteCount} site${siteCount === 1 ? '' : 's'})`);
    });

    locations.forEach((location: any) => {
      doc.addPage();
      this.writeLocationReport(doc, location);
    });

    this.writePageNumbers(doc);
    doc.end();
    return this.streamToBuffer(doc as any);
  }

  /** Renders one location's full detail block (header, manager history,
   * every site with all fields, that site's manager history, and its
   * assigned people/vehicles) onto the current page of `doc`, adding
   * new pages as needed if content overflows. */
  private writeLocationReport(doc: any, location: any) {
    const subLevels: any[] = Array.isArray(location.subLevels) ? location.subLevels : [];

    doc.fontSize(18).fillColor('#0f172a').text(location.siteName || location.name || 'Unnamed Location');
    doc.fontSize(9.5).fillColor('#64748b').text(`Location ID: ${location.id}`);
    doc.moveDown(0.2);
    doc
      .fontSize(10)
      .fillColor('#334155')
      .text(`Region: ${location.region || '-'}      Status: ${location.status || '-'}`);
    doc.moveDown(0.6);
    this.drawDivider(doc);
    doc.moveDown(0.5);

    if (location.manager) {
      doc.fontSize(11).fillColor('#0f172a').text(`Location Manager: ${location.manager}`);
      const history = Array.isArray(location.managerHistory) ? location.managerHistory : [];
      if (history.length) {
        doc.moveDown(0.15);
        doc.fontSize(9).fillColor('#64748b').text('Manager History:');
        history.forEach((h: any) => {
          const from = h.fromDate ? new Date(h.fromDate).toLocaleDateString() : '-';
          const to = h.toDate ? new Date(h.toDate).toLocaleDateString() : 'Present';
          doc.fontSize(9).fillColor('#475569').text(`   •  ${h.manager}   (${from} → ${to})`);
        });
      }
      doc.moveDown(0.7);
    }

    doc.fontSize(13).fillColor('#0f172a').text(`Sites (${subLevels.length})`, { underline: true });
    doc.moveDown(0.5);

    if (subLevels.length === 0) {
      doc.fontSize(10).fillColor('#94a3b8').text('No sites recorded for this location.');
      return;
    }

    const row = (label: string, value: any) => {
      doc
        .fontSize(9.5)
        .fillColor('#334155')
        .text(`${label}: `, { continued: true })
        .fillColor('#0f172a')
        .text(`${value ?? '-'}`);
    };

    subLevels.forEach((site: any, idx: number) => {
      // Keep a single site's record from being awkwardly split across
      // pages — start a fresh page if we're close to the bottom margin.
      if (doc.y > 660) doc.addPage();

      doc.fontSize(12).fillColor('#0f172a').text(`${idx + 1}. ${site.name || 'Unnamed Site'}`);
      doc.fontSize(9).fillColor('#64748b').text(`Site ID: ${site.id || '-'}`);
      doc.moveDown(0.25);

      row('Status', site.status);
      row('Client', site.client);
      row('Site Manager', site.manager);
      row('Contact Number', site.contactNumber);
      row('Address', site.address);
      row('Start Date', site.startDate ? new Date(site.startDate).toLocaleDateString() : '-');
      if (site.remarks) row('Remarks', site.remarks);

      const managerHistory = Array.isArray(site.managerHistory) ? site.managerHistory : [];
      if (managerHistory.length) {
        doc.moveDown(0.2);
        doc.fontSize(9).fillColor('#64748b').text('Previous Site Managers:');
        managerHistory.forEach((h: any) => {
          doc.fontSize(9).fillColor('#475569').text(`   •  ${h.managerName}   (${h.changedAt})`);
        });
      }

      const persons = Array.isArray(site.assignedPersons) ? site.assignedPersons : [];
      if (persons.length) {
        doc.moveDown(0.2);
        doc.fontSize(9).fillColor('#1d4ed8').text(`Assigned People (${persons.length}):`);
        persons.forEach((p: any) => {
          doc.fontSize(9).fillColor('#334155').text(`   •  ${p.name}${p.id ? `   (${p.id})` : ''}`);
        });
      }

      const vehicles = Array.isArray(site.assignedVehicles) ? site.assignedVehicles : [];
      if (vehicles.length) {
        doc.moveDown(0.2);
        doc.fontSize(9).fillColor('#7c3aed').text(`Assigned Vehicles (${vehicles.length}):`);
        vehicles.forEach((v: any) => {
          doc
            .fontSize(9)
            .fillColor('#334155')
            .text(`   •  ${v.vehiclePlate || v.id || 'Unknown'}${v.driver ? `   — Driver: ${v.driver}` : ''}`);
        });
      }

      doc.moveDown(0.6);
      if (idx < subLevels.length - 1) {
        this.drawDivider(doc);
        doc.moveDown(0.6);
      }
    });
  }

  private drawDivider(doc: any) {
    const y = doc.y;
    doc.save();
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, y).lineTo(555, y).stroke();
    doc.restore();
  }

  /** Stamps "Page X of Y" in the footer of every page once the full
   * document has been laid out (requires bufferPages: true). */
  private writePageNumbers(doc: any) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const bottom = doc.page.height - 30;
      doc
        .fontSize(8)
        .fillColor('#94a3b8')
        .text(`Page ${i + 1 - range.start} of ${range.count}`, 40, bottom, {
          width: doc.page.width - 80,
          align: 'center',
        });
    }
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

    // Server always owns sub-level id assignment. Never trust ids sent by the client.
    const subLevels = this.normalizeSubLevels(id, data.subLevels, []);

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
        subLevels: subLevels as any, // Json column
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

    const existingSubLevels = this.parseExistingSubLevels(currentSite.subLevels);

    // Only touch subLevels if the caller actually sent them; otherwise leave untouched.
    const subLevels =
      data.subLevels !== undefined
        ? this.normalizeSubLevels(id, data.subLevels, existingSubLevels)
        : undefined;

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
          subLevels: subLevels === undefined ? undefined : (subLevels as any),
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

  // ─────────────────────────────────────────────────────────────
  // Sub-level (Site) helpers — this is the source of truth for ids
  // ─────────────────────────────────────────────────────────────

  /**
   * Takes whatever the client sent for subLevels and returns a clean,
   * fully-populated array where every entry has a guaranteed, unique,
   * sequential id in the form `${locationId}-SITE-##`.
   *
   * - Entries with a valid, already-known id (matching this location's
   *   id pattern) keep that id, so edits to existing sites don't get
   *   a new id every save.
   * - Entries with a missing/invalid/foreign id (new sites, or ids the
   *   client made up) get a fresh, never-before-used sequence number.
   * - The id space is derived from the union of `existing` ids and the
   *   incoming ids that validate, so deleted sites' sequence numbers
   *   are never reused (avoids collisions when a site is deleted and
   *   a new one is added in the same or a later request).
   * - `assignedPersons` / `assignedVehicles` are NOT part of the editable
   *   site form and are typically never sent by the location edit UI.
   *   To avoid silently wiping out assignments made via the dedicated
   *   assign-people / assign-vehicles endpoints every time someone edits
   *   a site's name, manager, etc., we carry those fields forward from
   *   the existing record unless the caller explicitly included them in
   *   the incoming payload (which the assign endpoints do, and a future
   *   "edit assignments inline" UI could too).
   */
  private normalizeSubLevels(
    locationId: string,
    incoming: Partial<SiteSubLevel>[] | undefined,
    existing: SiteSubLevel[],
  ): SiteSubLevel[] {
    if (!incoming) return existing;

    const idPattern = new RegExp(`^${this.escapeRegex(locationId)}-SITE-(\\d+)$`);
    const existingById = new Map(existing.map((s) => [s.id, s]));

    const seqFromId = (siteId?: string): number => {
      if (!siteId) return 0;
      const match = idPattern.exec(siteId);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Seed the "used" sequence set from both the current DB state and
    // any incoming entries that already carry a valid id for this location.
    const usedSeqs = new Set<number>();
    for (const s of existing) {
      const n = seqFromId(s.id);
      if (n > 0) usedSeqs.add(n);
    }
    for (const s of incoming) {
      const n = seqFromId(s.id);
      if (n > 0) usedSeqs.add(n);
    }

    let cursor = 0;
    const nextFreeSeq = (): number => {
      cursor = Math.max(cursor, ...(usedSeqs.size ? [...usedSeqs] : [0]));
      do {
        cursor += 1;
      } while (usedSeqs.has(cursor));
      usedSeqs.add(cursor);
      return cursor;
    };

    return incoming.map((s) => {
      const validId = s.id && idPattern.test(s.id) ? s.id : undefined;
      const id = validId || `${locationId}-SITE-${String(nextFreeSeq()).padStart(2, '0')}`;
      const prior = validId ? existingById.get(validId) : undefined;

      return {
        id,
        name: s.name?.trim() || '',
        manager: s.manager?.trim() || '',
        managerHistory: Array.isArray(s.managerHistory) ? s.managerHistory : [],
        region: s.region || '',
        seq: s.seq ?? 1,
        status: s.status || 'Planning',
        client: s.client || '',
        contactNumber: s.contactNumber || '',
        address: s.address || '',
        startDate: typeof s.startDate === 'string' ? s.startDate : '',
        remarks: s.remarks || '',
        // Preserve unless the caller explicitly sent a value for these.
        assignedPersons:
          s.assignedPersons !== undefined ? s.assignedPersons : prior?.assignedPersons || [],
        assignedVehicles:
          s.assignedVehicles !== undefined ? s.assignedVehicles : prior?.assignedVehicles || [],
      };
    });
  }

  private parseExistingSubLevels(raw: unknown): SiteSubLevel[] {
    if (!Array.isArray(raw)) return [];
    return raw as SiteSubLevel[];
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ─────────────────────────────────────────────────────────────
  // Location id helpers
  // ─────────────────────────────────────────────────────────────

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

  private streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err) => reject(err));
    });
  }

  private parseDate(value: Date | string, field: string): Date {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid date`);
    }
    return date;
  }
}