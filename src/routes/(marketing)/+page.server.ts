import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [projects, articles] = await Promise.all([
		db.project.findMany({
			include: {
				units: {
					where: { status: 'available' },
					orderBy: { price: 'asc' },
					take: 1
				}
			},
			orderBy: { createdAt: 'asc' }
		}),
		db.article.findMany({
			orderBy: { publishedAt: 'desc' },
			take: 3,
			select: { id: true, title: true, slug: true, category: true, excerpt: true, imageUrl: true }
		}),
	]);
	return { projects, articles };
};
