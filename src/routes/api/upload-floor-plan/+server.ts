import { json, error } from '@sveltejs/kit';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import db from '$lib/server/db';
import type { RequestHandler } from './$types';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
  'application/pdf',
];
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const unitId = formData.get('unitId') as string | null;

  if (!file || !unitId) throw error(400, 'Missing file or unitId');
  if (!ALLOWED_TYPES.includes(file.type)) throw error(400, 'Unsupported file type');
  if (file.size > MAX_SIZE) throw error(400, 'File exceeds 20 MB limit');

  const unit = await db.unit.findUnique({ where: { id: unitId }, select: { id: true } });
  if (!unit) throw error(404, 'Unit not found');

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const filename = `${unitId}.${ext}`;
  const dir = join(process.cwd(), 'static', 'uploads', 'floor-plans');
  mkdirSync(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(join(dir, filename), buffer);

  const url = `/uploads/floor-plans/${filename}`;
  await db.unit.update({ where: { id: unitId }, data: { floorPlanUrl: url } });

  return json({ url });
};
