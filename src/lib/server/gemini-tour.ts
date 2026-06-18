// Tour & floor-plan image generation via local Stable Diffusion (Automatic1111 WebUI).
import * as fs from 'fs';
import * as path from 'path';
import { getRooms } from '$lib/tour-rooms';
import { generateLocalImage } from './local-image';

const STYLE_SUFFIX = [
  'architectural interior render, photorealistic, daytime mediterranean light,',
  'white walls, light oak floors, minimalist luxury furniture, no people,',
  'wide-angle lens 24mm, sharp focus, high resolution,',
  'contemporary cyprus residential, clean lines, warm neutral palette',
].join(' ');

const ANGLES = [
  {
    key: 'left' as const,
    tag: 'l',
    hint: 'camera positioned at the left side of the room, rotated approximately 30 degrees rightward, wide-angle shot showing the left wall and far corner',
  },
  {
    key: 'front' as const,
    tag: 'f',
    hint: 'camera centered, facing straight ahead, symmetrical composition of the main feature wall',
  },
  {
    key: 'right' as const,
    tag: 'r',
    hint: 'camera positioned at the right side of the room, rotated approximately 30 degrees leftward, wide-angle shot showing the right wall and far corner',
  },
];

function dimsForQuality(quality: string): { width: number; height: number; steps: number } {
  if (quality === 'low')    return { width: 768,  height: 512,  steps: 20 };
  if (quality === 'medium') return { width: 1024, height: 768,  steps: 24 };
  return { width: 1280, height: 832, steps: 32 };
}

/**
 * Generates a top-down isometric floor plan via local SD.
 * `apiKey` and `imageModel` are accepted for API back-compat but ignored —
 * the local SD model is configured via env (LOCAL_IMAGE_MODEL).
 */
export async function generateFloorPlanImage(
  _apiKey: string,
  unit: { id: string; code: string; type: string },
  staticDir: string,
  _imageModel = 'sdxl',
  imageQuality = 'high',
): Promise<string> {
  const rooms = getRooms(unit.type);
  const roomList = rooms
    .map((r, i) => `${i + 1}. ${r.label}${r.dims ? ` (${r.dims})` : ''}`)
    .join(', ');

  const prompt = [
    `isometric 3D architectural floor plan of a ${unit.type} apartment, bird's-eye view at 45-degree angle.`,
    `rooms: ${roomList}.`,
    'white cream walls with clear dark outlines, light oak parquet floors, rooms proportionally sized.',
    'each room labeled with a small white circular badge showing its number.',
    'mediterranean cyprus residential style, soft daylight from above-left.',
    'professional clean render, no people, light gray background, all rooms visible from above',
  ].join(' ');

  const { width, height, steps } = dimsForQuality(imageQuality);
  const b64 = await generateLocalImage({ prompt, width, height, steps });

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
  _apiKey: string,
  unit: { id: string; code: string; type: string },
  staticDir: string,
  _imageModel = 'sdxl',
  fillFrom: TourImageMeta[] = [],
  imageQuality = 'high',
): Promise<GenerateResult> {
  const rooms = getRooms(unit.type);

  const existing = new Map(
    fillFrom
      .filter(img => img.roomIndex != null && img.angle)
      .map(img => [`${img.roomIndex}-${img.angle}`, img]),
  );

  const outputDir = path.join(staticDir, 'images', 'tours', unit.code.toLowerCase());
  fs.mkdirSync(outputDir, { recursive: true });

  const { width, height, steps } = dimsForQuality(imageQuality);
  const images: TourImageMeta[] = [];

  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    const roomSlug = room.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    for (const angle of ANGLES) {
      const key = `${i}-${angle.key}`;

      if (existing.has(key)) {
        images.push(existing.get(key)!);
        continue;
      }

      const prompt = `${room.fragment}. ${angle.hint}. ${STYLE_SUFFIX}`;
      let b64: string;
      try {
        b64 = await generateLocalImage({ prompt, width, height, steps });
      } catch {
        continue;
      }

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
