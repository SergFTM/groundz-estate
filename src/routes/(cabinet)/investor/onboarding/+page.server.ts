import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  const [kycDocs, investments] = await Promise.all([
    db.document.findMany({
      where: { userId: user.id, category: { in: ['passport', 'kyc', 'proof_of_funds'] } },
      select: { status: true },
    }),
    db.holding.findMany({
      where: { userId: user.id },
      select: { id: true },
    }),
  ]);

  return {
    user,
    kycDone: kycDocs.length > 0,
    hasPools: investments.length > 0,
    hasCommit: investments.length > 0,
  };
};
