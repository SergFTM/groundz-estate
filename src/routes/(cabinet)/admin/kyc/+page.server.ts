import db from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { sendKycStatusEmail } from '$lib/server/email';
import type { PageServerLoad, Actions } from './$types';

const KYC_CATEGORIES = ['passport', 'kyc', 'proof_of_funds'] as const;

const actionSchema = z.object({
  id:     z.string().uuid(),
  userId: z.string().uuid(),
});

export const load: PageServerLoad = async () => {
  const investors = await db.user.findMany({
    where: { role: 'investor' },
    include: {
      documents: {
        where: { category: { in: [...KYC_CATEGORIES] } },
        orderBy: { uploadedAt: 'desc' },
        include: { pool: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = investors
    .filter(inv => inv.documents.length > 0)
    .map(inv => {
      const docs = inv.documents;
      const hasApproved = docs.some(d => d.status === 'approved');
      const hasRejected = docs.some(d => d.status === 'action_required');
      const hasPending  = docs.some(d => d.status === 'pending');
      const overallStatus =
        hasApproved && !hasRejected && !hasPending ? 'approved'
        : hasRejected ? 'action_required'
        : 'pending';

      return {
        id: inv.id, name: inv.name, email: inv.email,
        overallStatus,
        docs: docs.map(d => ({
          id: d.id, category: d.category, name: d.name,
          status: d.status, fileUrl: d.fileUrl,
          fileSize: d.fileSize, uploadedAt: d.uploadedAt,
          poolName: d.pool?.name ?? null,
        })),
      };
    });

  const kpis = {
    total:    rows.length,
    approved: rows.filter(r => r.overallStatus === 'approved').length,
    pending:  rows.filter(r => r.overallStatus === 'pending').length,
    rejected: rows.filter(r => r.overallStatus === 'action_required').length,
  };

  return { rows, kpis };
};

export const actions: Actions = {
  approve: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'internal_team') {
      return fail(403, { error: 'Forbidden' });
    }
    const parsed = actionSchema.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return fail(400, { error: parsed.error.issues[0]?.message });

    const doc = await db.document.update({
      where: { id: parsed.data.id },
      data: { status: 'approved' },
      include: { user: { select: { email: true, name: true } } },
    });

    void sendKycStatusEmail({
      email: doc.user.email,
      name: doc.user.name,
      status: 'approved',
      documentName: doc.name,
    });

    return { success: true };
  },

  reject: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'internal_team') {
      return fail(403, { error: 'Forbidden' });
    }
    const parsed = actionSchema.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return fail(400, { error: parsed.error.issues[0]?.message });

    const doc = await db.document.update({
      where: { id: parsed.data.id },
      data: { status: 'action_required' },
      include: { user: { select: { email: true, name: true } } },
    });

    void sendKycStatusEmail({
      email: doc.user.email,
      name: doc.user.name,
      status: 'action_required',
      documentName: doc.name,
    });

    return { success: true };
  },

  approveAll: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'internal_team') {
      return fail(403, { error: 'Forbidden' });
    }
    const { userId } = Object.fromEntries(await request.formData());
    if (!userId) return fail(400, { error: 'User ID required' });
    await db.document.updateMany({
      where: { userId: String(userId), category: { in: [...KYC_CATEGORIES] } },
      data: { status: 'approved' },
    });
    return { success: true };
  },
} satisfies Actions;
