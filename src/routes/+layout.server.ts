import type { LayoutServerLoad } from './$types';
import { DEFAULT_LOCALE, isLocale } from '$lib/i18n';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const cookie = cookies.get('locale');
	const locale = isLocale(cookie) ? cookie : DEFAULT_LOCALE;
	return { user: locals.user, locale };
};
