import db from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const projects = await db.project.findMany({
		include: {
			units: {
				where: { status: 'available' },
				orderBy: { price: 'asc' },
				take: 1
			}
		},
		orderBy: { createdAt: 'asc' }
	});
	return { projects };
};
