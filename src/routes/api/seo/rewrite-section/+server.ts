// POST /api/seo/rewrite-section
import { json, error } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { callAI, AiClientError } from '$lib/server/seo/ai-client.js';
import prisma from '$lib/server/db.js';
import type { RequestHandler } from './$types';

const PROMPT_PATH = resolve('src/lib/server/seo/prompts/rewrite-suggest.txt');

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body) throw error(400, 'Invalid JSON');

  const { pageId, sectionType, originalText, targetIntent, targetKeywords } = body;
  if (!pageId || !sectionType || !originalText) throw error(400, 'Missing required fields');

  const promptTemplate = readFileSync(PROMPT_PATH, 'utf-8');
  const prompt = promptTemplate
    .replace('{{sectionType}}', sectionType)
    .replace('{{targetIntent}}', targetIntent ?? 'commercial')
    .replace('{{targetKeywords}}', Array.isArray(targetKeywords) ? targetKeywords.join(', ') : '')
    .replace('{{originalText}}', originalText);

  try {
    const { content: raw } = await callAI({ prompt });
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid AI response');
    const parsed = JSON.parse(match[0]);

    const revision = await prisma.seoContentRevision.create({
      data: {
        seoPageProfileId: pageId,
        originalText,
        proposedText: parsed.proposedText,
        changeType: sectionType,
        status: 'pending',
      },
    });

    return json({
      revisionId: revision.id,
      proposedText: parsed.proposedText,
      changeType: sectionType,
      requiresApproval: true,
    });
  } catch (err) {
    if (err instanceof AiClientError && err.code === 'rate_limit') throw error(429, 'AI rate limit');
    throw error(500, 'Rewrite failed');
  }
};
