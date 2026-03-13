import db from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { PageServerLoad, Actions } from './$types';

const uploadSchema = z.object({
  name:     z.string().min(1, 'File name is required'),
  category: z.enum(['floor_plan', 'subscription_agreement', 'contract', 'kyc', 'other'], {
    message: 'Invalid category',
  }),
  fileUrl:  z.string().url('Must be a valid URL'),
  fileSize: z.coerce.number().min(0).default(0),
});

export const load: PageServerLoad = async ({ params }) => {
  const pool = await db.investmentPool.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });
  if (!pool) throw redirect(302, '/admin/investment-pools');

  const documents = await db.document.findMany({
    where: { poolId: params.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { uploadedAt: 'desc' },
  });

  // Count investors who have access (are invested in this pool)
  const investorCount = await db.investorInvestment.count({
    where: { poolId: params.id },
  });

  return { pool, documents, investorCount };
};

export const actions: Actions = {
  upload: async ({ request, locals, params }) => {
    if (!locals.user || locals.user.role !== 'internal_team') {
      return fail(403, { error: 'Forbidden' });
    }
    const raw = Object.fromEntries(await request.formData());
    const parsed = uploadSchema.safeParse(raw);
    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }
    const { name, category, fileUrl, fileSize } = parsed.data;
    await db.document.create({
      data: {
        userId:   locals.user.id,
        poolId:   params.id,
        name,
        category,
        fileUrl,
        fileSize,
        status:   'approved',
      },
    });
    return { success: true };
  },

  delete: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'internal_team') {
      return fail(403, { error: 'Forbidden' });
    }
    const { id } = Object.fromEntries(await request.formData());
    if (!id) return fail(400, { error: 'ID required' });
    await db.document.delete({ where: { id: String(id) } });
    return { success: true };
  },
} satisfies Actions;
