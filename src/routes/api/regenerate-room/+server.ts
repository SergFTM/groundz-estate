import { json, error } from '@sveltejs/kit';
import { getSetting } from '$lib/server/settings';
import { getRooms } from '$lib/tour-rooms';
import OpenAI from 'openai';
import db from '$lib/server/db';
import * as fs from 'fs';
import * as path from 'path';
import type { RequestHandler } from './$types';

const STYLE_SUFFIX = [
  'Architectural interior render, photorealistic, daytime Mediterranean light,',
  'white walls, light oak floors, minimalist luxury furniture, no people,',
  'wide-angle lens 24mm, sharp focus, high resolution.',
  'Style: contemporary Cyprus residential, clean lines, warm neutral palette.',
].join(' ');

const ANGLE_HINTS: Record<string, string> = {
  left:  'Camera positioned at the left side of the room, rotated approximately 30 degrees rightward, wide-angle shot showing the left wall and far corner.',
  front: 'Camera centered, facing straight ahead, symmetrical composition of the main feature wall.',
  right: 'Camera positioned at the right side of the room, rotated approximately 30 degrees leftward, wide-angle shot showing the right wall and far corner.',
};

const ANGLE_TAG: Record<string, string> = { left: 'l', front: 'f', right: 'r' };

function buildParams(model: string, prompt: string): Parameters<OpenAI['images']['generate']>[0] {
  const base = model === 'dall-e-3-hd' ? 'dall-e-3' : model;
  if (base === 'gpt-image-1') {
    return { model: base, prompt, n: 1, size: '1536x1024', quality: 'high' };
  }
  if (base === 'dall-e-2') {
    return { model: base, prompt, n: 1, size: '1024x1024', response_format: 'b64_json' };
  }
  return { model: base, prompt, n: 1, size: '1792x1024', response_format: 'b64_json', quality: model === 'dall-e-3-hd' ? 'hd' : 'standard' };
}

export const POST: RequestHandler = async ({ request }) => {
  const { unitId, roomIndex, angle = 'front' } = await request.json();
  if (!unitId || roomIndex == null) throw error(400, 'unitId and roomIndex required');

  const [apiKey, imageModel] = await Promise.all([
    getSetting('openai_api_key'),
    getSetting('openai_image_model'),
  ]);
  if (!apiKey) throw error(503, 'OpenAI API key not configured');

  const unit = await db.unit.findUnique({
    where: { id: unitId },
    select: { id: true, code: true, type: true },
  });
  if (!unit) throw error(404, 'Unit not found');

  const rooms = getRooms(unit.type);
  const room = rooms[roomIndex];
  if (!room) throw error(400, `Room index ${roomIndex} out of range`);

  const model = imageModel ?? 'dall-e-3';
  const angleHint = ANGLE_HINTS[angle] ?? ANGLE_HINTS.front;
  const prompt = `${room.fragment}. ${angleHint} ${STYLE_SUFFIX}`;

  let b64: string | null | undefined;
  try {
    const client = new OpenAI({ apiKey });
    const resp = await client.images.generate(buildParams(model, prompt)) as { data: Array<{ b64_json?: string | null }> };
    b64 = resp.data?.[0]?.b64_json;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ success: false, message: msg }, { status: 500 });
  }

  if (!b64) return json({ success: false, message: 'No image returned' }, { status: 500 });

  const outputDir = path.join(process.cwd(), 'static', 'images', 'tours', unit.code.toLowerCase());
  fs.mkdirSync(outputDir, { recursive: true });

  const roomSlug = room.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const tag = ANGLE_TAG[angle] ?? 'f';
  const filename = `${String(roomIndex + 1).padStart(2, '0')}-${roomSlug}-${tag}.jpg`;
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(b64, 'base64'));

  const url = `/images/tours/${unit.code.toLowerCase()}/${filename}?t=${Date.now()}`;
  return json({ success: true, url, label: room.label, roomIndex, angle });
};
