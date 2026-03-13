// GET /api/seo/page/[id]
import { json, error } from '@sveltejs/kit';
import prisma from '$lib/server/db.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const profile = await prisma.seoPageProfile.findUnique({
    where: { id: params.id },
  });

  if (!profile) throw error(404, 'SEO page profile not found');

  const [latestAudit, pendingRevisions, linkSuggestions] = await Promise.all([
    prisma.seoAudit.findFirst({
      where: { seoPageProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.seoContentRevision.findMany({
      where: { seoPageProfileId: profile.id, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.internalLinkSuggestion.findMany({
      where: { fromProfileId: profile.id },
      orderBy: { confidence: 'desc' },
      take: 10,
    }),
  ]);

  return json({ profile, latestAudit, pendingRevisions, linkSuggestions });
};
