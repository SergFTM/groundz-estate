// Combined auth + rate-limit guard for AI endpoints.
import { error, type RequestEvent } from '@sveltejs/kit';
import { rateLimit } from './rate-limit';

type Bucket = 'public' | 'chat' | 'text_ai' | 'image_ai' | 'admin_job';

interface AiGuardOptions {
  /** Required role(s). Omit or pass 'any' to allow any authenticated user. */
  roles?: string[] | 'any';
  /** Cost bucket. Defaults to 'text_ai'. */
  bucket?: Bucket;
  /** Allow anonymous callers (for public-form endpoints). */
  allowAnonymous?: boolean;
}

/**
 * Standard guard for AI endpoints. Throws on auth/role/limit violation.
 * Returns the authenticated user (or null when allowAnonymous).
 */
export function aiGuard(event: RequestEvent, options: AiGuardOptions = {}) {
  const { roles, bucket = 'text_ai', allowAnonymous = false } = options;
  const user = event.locals.user;

  if (!user && !allowAnonymous) throw error(401, 'Authentication required');
  if (user && roles && roles !== 'any' && !roles.includes(user.role)) {
    throw error(403, 'Forbidden');
  }

  rateLimit(event, bucket);
  return user;
}
