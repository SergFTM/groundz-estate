import { writable } from 'svelte/store';

interface PlatformState {
	isAuthenticated: boolean;
	userRole: string | null;
	userName: string | null;
	selectedPropertyPrice: number;
}

export const platformStore = writable<PlatformState>({
	isAuthenticated: false,
	userRole: null,
	userName: null,
	selectedPropertyPrice: 450000
});

interface ToastMessage {
	id: number;
	type: 'success' | 'error' | 'info';
	message: string;
}

let toastId = 0;

function createToastStore() {
	const { subscribe, update } = writable<ToastMessage[]>([]);

	return {
		subscribe,
		show(type: ToastMessage['type'], message: string) {
			const id = ++toastId;
			update((toasts) => [...toasts, { id, type, message }]);
			setTimeout(() => {
				update((toasts) => toasts.filter((t) => t.id !== id));
			}, 5000);
		},
		success(message: string) {
			this.show('success', message);
		},
		error(message: string) {
			this.show('error', message);
		},
		info(message: string) {
			this.show('info', message);
		},
		dismiss(id: number) {
			update((toasts) => toasts.filter((t) => t.id !== id));
		}
	};
}

export const toastStore = createToastStore();
