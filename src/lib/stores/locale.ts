import { writable } from 'svelte/store';
import { DEFAULT_LOCALE, type Locale } from '$lib/i18n';

// Current UI locale. Initialized from server data in the root layout
// (+layout.svelte) so SSR and client agree.
export const locale = writable<Locale>(DEFAULT_LOCALE);

// Persist choice in a cookie and reload so the server re-renders in the new
// locale (keeps SSR output correct). Client-only.
export function setLocale(next: Locale): void {
  document.cookie = `locale=${next};path=/;max-age=31536000;samesite=lax`;
  location.reload();
}
