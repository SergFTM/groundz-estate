import { redirect } from '@sveltejs/kit';
import type { ServerLoadEvent } from '@sveltejs/kit';

export function requireAuth(event: ServerLoadEvent) {
	if (!event.locals.user) {
		throw redirect(302, '/auth/login');
	}
	return event.locals.user;
}

export function requireRole(event: ServerLoadEvent, roles: string[]) {
	const user = requireAuth(event);
	if (!roles.includes(user.role)) {
		throw redirect(302, '/');
	}
	return user;
}
