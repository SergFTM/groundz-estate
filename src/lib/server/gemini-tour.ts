import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { getRooms } from '$lib/tour-rooms';

const STYLE_SUFFIX = [
  'Architectural interior render, photorealistic, daytime Mediterranean light,',
  'white walls, light oak floors, minimalist luxury furniture, no people,',
  'wide-angle lens 24mm, sharp focus, high resolution.',
  'Style: contemporary Cyprus residential, clean lines, warm neutral palette.',
].join(' ');

const ANGLES = [
  {
    key: 'left' as const,
    tag: 'l',
    hint: 'Camera positioned at the left side of the room, rotated approximately 30 degrees rightward, wide-angle shot showing the left wall and far corner.',
  },
  {
    key: 'front' as const,
    tag: 'f',
    hint: 'Camera centered, facing straight ahead, symmetrical composition of the main feature wall.',
  },
  {
    key: 'right' as const,
    tag: 'r',
    hint: 'Camera positioned at the right side of the room, rotated approximately 30 degrees leftward, wide-angle shot showing the right wall and far corner.',
  },
];

function buildParams(model: string, prompt: string, quality = 'high'): Parameters<OpenAI['images']['generate']>[0] {
  const base = model === 'dall-e-3-hd' ? 'dall-e-3' : model;
  if (base === 'gpt-image-1') {
    // high → 1536×1024 for better room detail; low/medium → 1024×1024 (cheaper)
    const size = quality === 'high' ? '1536x1024' : '1024x1024';
    return { model: base, prompt, n: 1, size, quality: quality as 'low' | 'medium' | 'high' };
  }
  if (base === 'dall-e-2') {
    return { model: base, prompt, n: 1, size: '1024x1024', response_format: 'b64_json' };
  }
  return {
    model: base, prompt, n: 1, size: '1792x1024', response_format: 'b64_json',
    quality: model === 'dall-e-3-hd' ? 'hd' : 'standard',
  };
}

export async function generateFloorPlanImage(
  apiKey: string,
  unit: { id: string; code: string; type: string },
  staticDir: string,
  imageModel = 'gpt-image-1',
  imageQuality = 'high',
): Promise<string> {
  const client = new OpenAI({ apiKey });
  const rooms = getRooms(unit.type);

  const roomList = rooms
    .map((r, i) => `${i + 1}. ${r.label}${r.dims ? ` (${r.dims})` : ''}`)
    .join(', ');

  const prompt = [
    `Isometric 3D architectural floor plan of a ${unit.type} apartment, bird's-eye view at 45-degree angle.`,
    `Rooms: ${roomList}.`,
    'White cream walls with clear dark outlines, light oak parquet floors, rooms proportionally sized.',
    'Each room labeled with a small white circular badge showing its number (1, 2, 3...).',
    'Mediterranean Cyprus residential style, soft daylight from above-left.',
    'Professional clean render, no people, light gray background, all rooms visible from above.',
  ].join(' ');

  const params = buildParams(imageModel, prompt, imageQuality);
  const response = await client.images.generate(params) as { data: Array<{ b64_json?: string | null }> };

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image data returned for floor plan');

  const outputDir = path.join(staticDir, 'images', 'tours', unit.code.toLowerCase());
  fs.mkdirSync(outputDir, { recursive: true });

  const filename = 'floor-plan.jpg';
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(b64, 'base64'));

  return `/images/tours/${unit.code.toLowerCase()}/${filename}`;
}

export interface TourImageMeta {
  url: string;
  label: string;
  roomIndex: number;
  angle: 'left' | 'front' | 'right';
}

export interface GenerateResult {
  unitCode: string;
  images: TourImageMeta[];
}

export async function generateTourImages(
  apiKey: string,
  unit: { id: string; code: string; type: string },
  staticDir: string,
  imageModel = 'dall-e-3',
  fillFrom: TourImageMeta[] = [],
  imageQuality = 'high',
): Promise<GenerateResult> {
  const client = new OpenAI({ apiKey });
  const rooms = getRooms(unit.type);

  // Build lookup of existing images by "roomIndex-angle" key
  const existing = new Map(
    fillFrom
      .filter(img => img.roomIndex != null && img.angle)
      .map(img => [`${img.roomIndex}-${img.angle}`, img]),
  );

  const outputDir = path.join(staticDir, 'images', 'tours', unit.code.toLowerCase());
  fs.mkdirSync(outputDir, { recursive: true });

  const images: TourImageMeta[] = [];

  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    const roomSlug = room.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    for (const angle of ANGLES) {
      const key = `${i}-${angle.key}`;

      // Reuse existing image — no API call needed
      if (existing.has(key)) {
        images.push(existing.get(key)!);
        continue;
      }

      const prompt = `${room.fragment}. ${angle.hint} ${STYLE_SUFFIX}`;
      const params = buildParams(imageModel, prompt, imageQuality);
      const response = await client.images.generate(params) as { data: Array<{ b64_json?: string | null }> };

      const b64 = response.data?.[0]?.b64_json;
      if (!b64) continue;

      const filename = `${String(i + 1).padStart(2, '0')}-${roomSlug}-${angle.tag}.jpg`;
      fs.writeFileSync(path.join(outputDir, filename), Buffer.from(b64, 'base64'));

      images.push({
        url: `/images/tours/${unit.code.toLowerCase()}/${filename}`,
        label: room.label,
        roomIndex: i,
        angle: angle.key,
      });
    }
  }

  return { unitCode: unit.code, images };
}
