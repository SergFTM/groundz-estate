import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  // All pools for the selector dropdown
  const allPools = await db.pool.findMany({
    select: { id: true, slug: true, name: true, country: true, status: true },
    orderBy: { name: 'asc' },
  });

  // Pools selected via ?pools=slug1,slug2,slug3 (max 3)
  const slugsParam = url.searchParams.get('pools') ?? '';
  const slugs = slugsParam
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (slugs.length === 0) {
    return { allPools, selected: [] };
  }

  const rows = await db.pool.findMany({
    where: { slug: { in: slugs } },
    include: {
      _count: { select: { investments: true } },
      constructionReports: { orderBy: { reportDate: 'desc' }, take: 1 },
      milestones: true,
    },
  });

  // Preserve slug order
  const selected = slugs
    .map(s => rows.find(p => p.slug === s))
    .filter((p): p is (typeof rows)[number] => !!p);

  return { allPools, selected };
};
