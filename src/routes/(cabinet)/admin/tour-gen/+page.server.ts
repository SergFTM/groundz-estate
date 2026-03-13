import db from '$lib/server/db';
import { getSetting } from '$lib/server/settings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [units, openaiKey, imageModel] = await Promise.all([
    db.unit.findMany({
      orderBy: [{ projectId: 'asc' }, { code: 'asc' }],
      include: { project: { select: { name: true, slug: true } } },
    }),
    getSetting('openai_api_key'),
    getSetting('openai_image_model'),
  ]);

  return {
    imageModel: imageModel ?? 'dall-e-3',
    units: units.map((u) => ({
      id: u.id,
      code: u.code,
      type: u.type,
      bedrooms: u.bedrooms,
      floor: u.floor,
      areaSqm: u.areaSqm,
      hasTour: !!u.tourImages && u.tourImages !== '[]',
      tourImages: u.tourImages ?? null,
      tourFloorPlan: u.tourFloorPlan ?? null,
      floorPlanUrl: u.floorPlanUrl ?? null,
      projectName: u.project.name,
      projectSlug: u.project.slug,
    })),
    openaiKeySet: !!openaiKey,
  };
};
