import db from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';
import { z, ZodError } from 'zod';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) throw redirect(302, `/auth/login?next=/pools/${params.slug}/commit`);

  const pool = await db.pool.findUnique({
    where: { slug: params.slug },
    select: {
      id: true, name: true, slug: true, country: true, city: true,
      goalAmount: true, raisedAmount: true, targetYield: true,
      targetIrr: true, termMonths: true, minTicket: true, maxTicket: true,
      status: true, imageUrl: true, dealType: true,
    },
  });

  if (!pool) throw error(404, 'Investment pool not found');
  if (pool.status !== 'active') throw redirect(303, `/pools/${params.slug}`);

  // Check for existing commitment
  const existing = await db.holding.findFirst({
    where: { userId: locals.user.id, poolId: pool.id },
    orderBy: { createdAt: 'desc' },
  });

  return { pool, user: locals.user, existing };
};

export const actions: Actions = {
  commit: async ({ request, params, locals }) => {
    if (!locals.user) throw redirect(302, `/auth/login?next=/pools/${params.slug}/commit`);

    const pool = await db.pool.findUnique({
      where: { slug: params.slug },
      select: { id: true, minTicket: true, maxTicket: true, status: true },
    });
    if (!pool || pool.status !== 'active') throw error(404, 'Pool not found or not active');

    const formData = await request.formData();
    const raw = Object.fromEntries(formData);

    const schema = z.object({
      amount: z.coerce.number().positive('Amount must be positive'),
      notes: z.string().optional().or(z.literal('')),
      agree: z.string().refine((v) => v === 'on', { message: 'You must agree to proceed' }),
    });

    try {
      const data = schema.parse(raw);

      if (data.amount < pool.minTicket) {
        return { errors: { amount: `Minimum ticket is €${pool.minTicket.toLocaleString()}` } };
      }
      if (pool.maxTicket && data.amount > pool.maxTicket) {
        return { errors: { amount: `Maximum ticket is €${pool.maxTicket.toLocaleString()}` } };
      }

      await db.holding.create({
        data: {
          userId: locals.user.id,
          poolId: pool.id,
          amount: data.amount,
          notes: data.notes || null,
          status: 'soft_commit',
        },
      });

      throw redirect(303, `/pools/${params.slug}/commit?success=1`);
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of err.issues) errors[issue.path[0] as string] = issue.message;
        return { errors };
      }
      throw err;
    }
  },
};
