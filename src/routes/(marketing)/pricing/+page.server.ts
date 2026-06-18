import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const rows = await db.membershipTier.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  });

  const tiers = rows.map((t) => {
    let perks: string[] = [];
    try {
      perks = t.perks ? (JSON.parse(t.perks) as string[]) : [];
    } catch {
      perks = [];
    }
    return { ...t, perks };
  });

  return { tiers, isLoggedIn: !!locals.user };
};
