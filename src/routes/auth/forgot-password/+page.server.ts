import { fail } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import type { Actions } from './$types';
import prisma from '$lib/server/db';

export const actions: Actions = {
	default: async ({ request, url }) => {
		const formData = await request.formData();
		const email = (formData.get('email') as string)?.trim().toLowerCase();

		if (!email || !email.includes('@')) {
			return fail(400, { error: 'Please enter a valid email address' });
		}

		const user = await prisma.user.findUnique({ where: { email } });

		// Always show success to prevent email enumeration
		if (!user) {
			return { success: true };
		}

		// Invalidate previous tokens for this email
		await prisma.passwordReset.updateMany({
			where: { email, usedAt: null },
			data: { usedAt: new Date() }
		});

		const token = randomUUID();
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		await prisma.passwordReset.create({
			data: { email, token, expiresAt }
		});

		const resetUrl = `${url.origin}/auth/reset-password?token=${token}`;

		// In dev: log to console. In production: send via email
		console.log(`\n[Password Reset] Link for ${email}:\n${resetUrl}\n`);

		return { success: true };
	}
};
