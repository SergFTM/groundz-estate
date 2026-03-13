import { error, redirect } from '@sveltejs/kit';
import db from '$lib/server/db';
import { z } from 'zod';
import { ZodError } from 'zod';
import type { PageServerLoad, Actions } from './$types';

const milestoneSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional().or(z.literal('')),
  plannedDate: z.string().min(1, 'Planned date is required'),
  actualDate: z.string().optional().or(z.literal('')),
  completionPct: z.coerce.number().int().min(0).max(100).default(0),
  status: z.enum(['pending', 'in_progress', 'completed', 'delayed']).default('pending'),
  notes: z.string().optional().or(z.literal('')),
});

export const load: PageServerLoad = async ({ params }) => {
  const pool = await db.investmentPool.findUnique({
    where: { id: params.id },
    select: { id: true, name: true }
  });
  if (!pool) throw error(404, 'Investment pool not found');
  return { pool };
};

export const actions: Actions = {
  create: async ({ request, params }) => {
    const pool = await db.investmentPool.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!pool) throw error(404, 'Investment pool not found');

    const formData = await request.formData();
    const raw = Object.fromEntries(formData);

    try {
      const data = milestoneSchema.parse(raw);
      await db.milestone.create({
        data: {
          poolId: params.id,
          name: data.name,
          description: data.description || null,
          plannedDate: new Date(data.plannedDate),
          actualDate: data.actualDate ? new Date(data.actualDate) : null,
          completionPct: data.completionPct,
          status: data.status,
          notes: data.notes || null,
        }
      });
      throw redirect(303, `/admin/investment-pools/${params.id}/edit`);
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of err.issues) errors[issue.path[0] as string] = issue.message;
        return { errors };
      }
      throw err;
    }
  }
};
