import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [pools, allPools, investorCount, projects] = await Promise.all([
		db.pool.findMany({
			where: { status: { not: 'draft' } },
			orderBy: { createdAt: 'desc' },
			take: 3,
		}),
		db.pool.findMany({
			where: { status: { not: 'draft' } },
			select: { goalAmount: true, raisedAmount: true, targetYield: true, targetIrr: true, country: true },
		}),
		db.holding.count(),
		db.project.findMany({
			include: { units: { where: { status: 'available' }, orderBy: { price: 'asc' }, take: 1 } },
			orderBy: { createdAt: 'asc' },
		}),
	]);

	const totalRaised = allPools.reduce((s, p) => s + p.raisedAmount, 0);
	const markets = new Set(allPools.map((p) => p.country)).size;
	const avgYield = allPools.length
		? allPools.reduce((s, p) => s + (p.targetIrr ?? p.targetYield), 0) / allPools.length
		: 0;

	return {
		pools,
		projects,
		metrics: {
			totalRaised,
			investorCount,
			markets,
			avgYield: Math.round(avgYield * 10) / 10,
		},
	};
};
