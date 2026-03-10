declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				email: string;
				role: string;
				name?: string;
			} | null;
		}
	}
}

export {};
