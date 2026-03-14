// src/routes/(cabinet)/admin/market-indices/+page.server.ts
import db from '$lib/server/db.js';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  const indices = await db.marketIndex.findMany({
    include: {
      components: true,
      _count: { select: { prices: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  return { indices };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const symbol = (data.get('symbol') as string)?.trim().toUpperCase();
    const name = (data.get('name') as string)?.trim();
    const market = data.get('market') as string;
    const type = data.get('type') as string;
    const color = (data.get('color') as string) ?? '#7a8c6e';
    const componentsJson = data.get('components') as string | null;

    if (!symbol || !name || !market || !type) {
      return { error: 'All fields required' };
    }

    const components: Array<{ symbol: string; name: string; weight: number }> =
      componentsJson ? JSON.parse(componentsJson) : [];

    await db.$transaction(async (tx) => {
      const index = await tx.marketIndex.create({
        data: { symbol, name, market, type, color },
      });
      if (type === 'custom' && components.length) {
        await tx.indexComponent.createMany({
          data: components.map(c => ({ indexId: index.id, symbol: c.symbol.toUpperCase(), name: c.name, weight: c.weight })),
        });
      }
    });

    return { success: true };
  },

  update: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const symbol = (data.get('symbol') as string)?.trim().toUpperCase();
    const name = (data.get('name') as string)?.trim();
    const market = data.get('market') as string;
    const type = data.get('type') as string;
    const color = (data.get('color') as string) ?? '#7a8c6e';
    const active = data.get('active') === 'true';
    const componentsJson = data.get('components') as string | null;

    if (!id) return { error: 'id required' };
    const components: Array<{ symbol: string; name: string; weight: number }> =
      componentsJson ? JSON.parse(componentsJson) : [];

    await db.$transaction(async (tx) => {
      await tx.marketIndex.update({
        where: { id },
        data: { symbol, name, market, type, color, active },
      });
      await tx.indexComponent.deleteMany({ where: { indexId: id } });
      if (type === 'custom' && components.length) {
        await tx.indexComponent.createMany({
          data: components.map(c => ({ indexId: id, symbol: c.symbol.toUpperCase(), name: c.name, weight: c.weight })),
        });
      }
    });

    return { success: true };
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    if (!id) return { error: 'id required' };
    await db.marketIndex.delete({ where: { id } });
    return { success: true };
  },

  toggleActive: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const active = data.get('active') === 'true';
    await db.marketIndex.update({ where: { id }, data: { active } });
    return { success: true };
  },
};
