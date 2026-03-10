import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('token');

	if (token) {
		const payload = verifyToken(token);
		if (payload) {
			event.locals.user = {
				id: payload.id,
				email: payload.email,
				role: payload.role,
				name: payload.name
			};
		} else {
			event.cookies.delete('token', { path: '/' });
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
