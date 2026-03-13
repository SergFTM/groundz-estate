import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const investors = await db.user.findMany({
    where: { role: 'investor' },
    include: {
      investments: {
        include: { pool: { select: { id: true, name: true, status: true } } },
        orderBy: { createdAt: 'desc' },
      },
      documents: {
        where: { category: { in: ['passport', 'kyc', 'proof_of_funds'] } },
        orderBy: { uploadedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = investors.map(inv => {
    const totalCommitted = inv.investments.reduce((s: number, i) => s + i.amount, 0);
    const funded = inv.investments.filter(i => i.status === 'funded').reduce((s: number, i) => s + i.amount, 0);
    const poolCount = inv.investments.length;

    const kycApproved = inv.documents.some(d => d.status === 'approved');
    const kycPending = !kycApproved && inv.documents.length > 0;

    return {
      id: inv.id,
      name: inv.name,
      email: inv.email,
      createdAt: inv.createdAt,
      totalCommitted,
      funded,
      poolCount,
      kycStatus: kycApproved ? 'approved' : kycPending ? 'pending' : 'missing',
      latestPool: inv.investments[0]?.pool.name ?? null,
    };
  });

  return { rows };
};
