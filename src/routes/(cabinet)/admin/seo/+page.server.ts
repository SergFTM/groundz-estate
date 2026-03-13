// /admin/seo — SEO dashboard server load
import prisma from '$lib/server/db.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [profiles, recentAudits, pendingRevisions, clusterCount, articleCount] = await Promise.all([
    prisma.seoPageProfile.findMany({
      orderBy: { lastAuditAt: 'desc' },
      take: 50,
    }),
    prisma.seoAudit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { pageProfile: { select: { route: true, pageType: true } } },
    }),
    prisma.seoContentRevision.count({ where: { status: 'pending' } }),
    prisma.seoKeywordCluster.count(),
    prisma.article.count(),
  ]);

  const avgScore = profiles.length
    ? profiles.reduce((sum: number, p) => sum + (p.seoScore ?? 0), 0) / profiles.length
    : 0;

  const issueCount = await prisma.seoAudit.findFirst({
    orderBy: { createdAt: 'desc' },
  }).then(audit => {
    if (!audit) return 0;
    try { return (JSON.parse(audit.issuesJson) as unknown[]).length; } catch { return 0; }
  });

  return {
    profiles,
    recentAudits,
    pendingRevisions,
    avgScore: Math.round(avgScore),
    issueCount,
    isFirstRun: clusterCount === 0 && profiles.length === 0,
    articleCount,
  };
};
