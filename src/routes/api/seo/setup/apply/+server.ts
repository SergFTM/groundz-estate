import { json } from '@sveltejs/kit';
import db from '$lib/server/db';
import { runSeoAudit } from '$lib/server/seo/orchestrator.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const { clusters } = await request.json() as {
    clusters: {
      name: string;
      primaryTerm: string;
      intent: string;
      locale: string;
      terms: string[];
      entities?: string[];
    }[];
  };

  if (!clusters?.length) return json({ error: 'No clusters provided' }, { status: 400 });

  // Create keyword clusters
  await Promise.all(clusters.map(c =>
    db.seoKeywordCluster.create({
      data: {
        name: c.name,
        locale: c.locale ?? 'en',
        intent: c.intent,
        primaryTerm: c.primaryTerm,
        termsJson: JSON.stringify(c.terms ?? []),
        entitiesJson: JSON.stringify(c.entities ?? []),
      },
    })
  ));

  // Queue background audits for all articles
  const articles = await db.article.findMany({
    select: { id: true, title: true, slug: true, excerpt: true, content: true },
  });

  for (const article of articles) {
    const html = `<html><head><title>${article.title}</title><meta name="description" content="${article.excerpt ?? ''}"><link rel="canonical" href="/knowledge/${article.slug}"></head><body>${article.content}</body></html>`;
    runSeoAudit({
      articleId: article.id,
      route: `/knowledge/${article.slug}`,
      html,
      locale: 'en',
      pageType: 'article',
    }).catch(() => null);
  }

  return json({ clustersCreated: clusters.length, articlesQueued: articles.length });
};
