// GET /sitemap.xml — static marketing routes + DB-driven pages.
// Referenced from static/robots.txt; answer-engine crawlers rely on it.
import db from '$lib/server/db';
import type { RequestHandler } from './$types';

const ORIGIN = 'https://groundz.estate';

const STATIC_ROUTES = [
  '/', '/about', '/faq', '/contact', '/pricing', '/pools', '/projects',
  '/knowledge', '/roi-calculator', '/lead-forms', '/lead-quiz',
  '/invest/how-it-works', '/invest/protections', '/invest/apply',
  '/privacy', '/terms', '/jobs',
];

export const GET: RequestHandler = async () => {
  const [articles, projects, pools] = await Promise.all([
    db.article.findMany({ select: { slug: true, publishedAt: true } }),
    db.project.findMany({ select: { slug: true, createdAt: true } }),
    db.pool.findMany({ select: { slug: true, updatedAt: true }, where: { slug: { not: null } } }),
  ]);

  const urls: { loc: string; lastmod?: Date }[] = [
    ...STATIC_ROUTES.map(r => ({ loc: r })),
    ...articles.map(a => ({ loc: `/knowledge/${a.slug}`, lastmod: a.publishedAt })),
    ...projects.map(p => ({ loc: `/projects/${p.slug}`, lastmod: p.createdAt })),
    ...pools.map(p => ({ loc: `/pools/${p.slug}`, lastmod: p.updatedAt })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${ORIGIN}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
