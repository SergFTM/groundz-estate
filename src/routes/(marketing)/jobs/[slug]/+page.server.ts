import { error, fail } from '@sveltejs/kit';
import db from '$lib/server/db';
import { sendLeadNotification } from '$lib/server/email';
import { jobApplicationSchema } from '$lib/utils/validators';
import { ZodError } from 'zod';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const job = await db.jobPosition.findUnique({
    where: { slug: params.slug },
  });

  if (!job || !job.isActive) throw error(404, 'Position not found');

  return { job };
};

export const actions = {
  applyJob: async ({ request, params }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const linkedinUrl = (formData.get('linkedinUrl') as string) || undefined;
    const coverLetter = (formData.get('coverLetter') as string) || undefined;

    try {
      jobApplicationSchema.parse({ name, email, linkedinUrl, coverLetter });
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of err.issues) errors[issue.path[0] as string] = issue.message;
        return fail(400, { errors });
      }
      return fail(400, { errors: { general: 'Invalid form data' } });
    }

    const position = await db.jobPosition.findUnique({ where: { slug: params.slug } });
    if (!position || !position.isActive) throw error(404, 'Position not found');

    await db.jobApplication.create({
      data: {
        positionId: position.id,
        name,
        email,
        linkedinUrl: linkedinUrl || null,
        coverLetter: coverLetter || null,
      },
    });

    await sendLeadNotification({
      source: 'job_application',
      name,
      email,
      data: JSON.stringify({ position: params.slug }),
    });

    return { success: true };
  },
} satisfies Actions;
