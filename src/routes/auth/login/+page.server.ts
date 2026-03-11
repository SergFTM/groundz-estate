import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { loginSchema, registerSchema } from '$lib/utils/validators';
import { hashPassword, verifyPassword, signToken } from '$lib/server/auth';
import prisma from '$lib/server/db';

function redirectForRole(role: string): string {
	switch (role) {
		case 'internal_team': return '/admin';
		case 'buyer': return '/buyer';
		case 'investor': return '/investor';
		case 'agent': return '/agent';
		default: return '/';
	}
}

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const data = {
			email: formData.get('email') as string,
			password: formData.get('password') as string
		};

		const result = loginSchema.safeParse(data);
		if (!result.success) {
			const errors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const key = issue.path[0] as string;
				errors[key] = issue.message;
			}
			return fail(400, { errors, values: { email: data.email } });
		}

		const user = await prisma.user.findUnique({
			where: { email: result.data.email }
		});

		if (!user) {
			return fail(400, { error: 'Invalid email or password', email: data.email });
		}

		const valid = await verifyPassword(result.data.password, user.password);
		if (!valid) {
			return fail(400, { error: 'Invalid email or password', email: data.email });
		}

		const token = signToken({
			id: user.id,
			email: user.email,
			role: user.role,
			name: user.name ?? undefined
		});

		cookies.set('token', token, {
			path: '/',
			maxAge: 3600,
			httpOnly: true,
			secure: false,
			sameSite: 'lax'
		});

		throw redirect(302, redirectForRole(user.role));
	},

	register: async ({ request, cookies }) => {
		const formData = await request.formData();
		const data = {
			name: formData.get('name') as string,
			email: formData.get('email') as string,
			password: formData.get('password') as string,
			role: formData.get('role') as string
		};

		const result = registerSchema.safeParse(data);
		if (!result.success) {
			const errors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const key = issue.path[0] as string;
				errors[key] = issue.message;
			}
			return fail(400, { errors, values: { name: data.name, email: data.email, role: data.role } });
		}

		const existing = await prisma.user.findUnique({
			where: { email: result.data.email }
		});

		if (existing) {
			return fail(400, { error: 'Email already registered' });
		}

		const hashed = await hashPassword(result.data.password);

		const user = await prisma.user.create({
			data: {
				email: result.data.email,
				password: hashed,
				name: result.data.name,
				role: result.data.role
			}
		});

		const token = signToken({
			id: user.id,
			email: user.email,
			role: user.role,
			name: user.name ?? undefined
		});

		cookies.set('token', token, {
			path: '/',
			maxAge: 3600,
			httpOnly: true,
			secure: false,
			sameSite: 'lax'
		});

		throw redirect(302, redirectForRole(user.role));
	}
};
