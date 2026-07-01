import { FrontendFallbacksService } from './frontend-fallbacks.service';

describe('FrontendFallbacksService', () => {
  it('creates and lists transfer notes', async () => {
    const service = new FrontendFallbacksService();

    const created = await service.create('transfer-notes', {
      id: 'TRN-001',
      fromLocationId: 'SITE-1',
      toLocationId: 'SITE-2',
      items: [{ itemName: 'Drill' }],
    });

    expect(created.id).toBeDefined();
    const all = await service.findAll('transfer-notes');
    expect(all).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.id })]));
  });
});
