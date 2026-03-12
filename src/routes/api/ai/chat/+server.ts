import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { chat } from '$lib/server/ai';
import type { ChatRole, Message } from '$lib/server/ai';

const VALID_ROLES: ChatRole[] = ['public', 'buyer', 'investor', 'agent', 'internal_team'];

export const POST: RequestHandler = async ({ request, locals }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'invalid JSON body');
  }

  if (!body || typeof body !== 'object') throw error(400, 'invalid request body');

  const { message, role, userId, history } = body as Record<string, unknown>;

  if (typeof message !== 'string' || !message.trim()) {
    throw error(400, 'message is required');
  }

  if (!VALID_ROLES.includes(role as ChatRole)) {
    throw error(400, 'invalid role');
  }

  const chatRole = role as ChatRole;

  // Auth guard for non-public roles
  if (chatRole !== 'public') {
    if (typeof userId !== 'string' || !userId) throw error(400, 'userId required for authenticated roles');
    if (!locals.user) throw error(401, 'authentication required');
    if (userId !== locals.user.id) throw error(403, 'userId mismatch');
    if (locals.user.role !== chatRole) throw error(403, 'role mismatch');
  }

  // Normalise history — keep last 6, skip malformed entries
  const safeHistory: Message[] = Array.isArray(history)
    ? (history as unknown[])
        .filter(
          (m): m is Message =>
            typeof m === 'object' &&
            m !== null &&
            ((m as Message).role === 'user' || (m as Message).role === 'assistant') &&
            typeof (m as Message).content === 'string'
        )
        .slice(-6)
    : [];

  try {
    const result = await chat({
      message: message.slice(0, 500),
      role: chatRole,
      userId: typeof userId === 'string' ? userId : undefined,
      history: safeHistory,
    });
    return json(result);
  } catch {
    return json({ reply: 'Что-то пошло не так. Попробуй ещё раз.' }, { status: 500 });
  }
};
