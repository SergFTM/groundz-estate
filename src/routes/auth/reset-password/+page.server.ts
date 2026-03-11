import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import prisma from '$lib/server/db';
import { hashPassword } from '$lib/server/auth';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	if (!token) {
		throw redirect(302, '/auth/forgot-password');
	}

	const reset = await prisma.passwordReset.findUnique({ where: { token } });
	if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
		return { valid: false, token };
	}

	return { valid: true, token };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const token = formData.get('token') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!token) {
			return fail(400, { error: 'Reset token is missing' });
		}

		if (!password || password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match' });
		}

		const reset = await prisma.passwordReset.findUnique({ where: { token } });
		if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
			return fail(400, { error: 'This reset link has expired or is invalid' });
		}

		const user = await prisma.user.findUnique({ where: { email: reset.email } });
		if (!user) {
			return fail(400, { error: 'User not found' });
		}

		const hashed = await hashPassword(password);

		await prisma.user.update({
			where: { id: user.id },
			data: { password: hashed }
		});

		await prisma.passwordReset.update({
			where: { id: reset.id },
			data: { usedAt: new Date() }
		});

		return { success: true };
	}
};
