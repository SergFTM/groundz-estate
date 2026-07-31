// Pure logic/types/constants extracted from tour-gen/+page.svelte to slim the page.
// No Svelte state here — functions take model/quality as args. UI + API orchestration
// stay in +page.svelte (deeply coupled to component state).

export interface TourImage {
  url: string;
  label: string;
  roomIndex?: number;
  angle?: 'left' | 'front' | 'right';
}

export interface UnitRow {
  id: string;
  code: string;
  type: string;
  bedrooms: number;
  floor: number;
  areaSqm: number;
  hasTour: boolean;
  tourImages: string | null;
  tourFloorPlan: string | null;
  floorPlanUrl: string | null;
  projectName: string;
  projectSlug: string;
}

export type GenStatus = 'idle' | 'generating' | 'done' | 'error';
export type ImageQuality = 'low' | 'medium' | 'high';

// Price per image by model/quality (USD, verified from billing).
export const PRICE_PER_IMAGE: Record<string, number> = {
  'gpt-image-1': 0.222, // high, 1536×1024 (verified: $4/18imgs)
  'gpt-image-1-medium': 0.042, // medium, 1024×1024
  'gpt-image-1-low': 0.011, // low, 1024×1024
  'dall-e-3': 0.08,
  'dall-e-3-hd': 0.12,
  'dall-e-2': 0.02,
};

export const ANGLE_ICON: Record<string, string> = { left: '◂', front: '●', right: '▸' };
export const ANGLE_LABEL: Record<string, string> = { left: 'Left', front: 'Front', right: 'Right' };

export function parseImages(unit: UnitRow): TourImage[] {
  if (!unit.tourImages) return [];
  try {
    return JSON.parse(unit.tourImages);
  } catch {
    return [];
  }
}

export function priceKey(model: string, quality: ImageQuality): string {
  if (model === 'gpt-image-1' && quality !== 'high') return `gpt-image-1-${quality}`;
  return model;
}

export function estimateCost(count: number, model: string, quality: ImageQuality): string {
  const price = PRICE_PER_IMAGE[priceKey(model, quality)] ?? 0.08;
  const total = count * price;
  const totalStr = total < 0.01 ? '<$0.01' : `~$${total.toFixed(2)}`;
  return `${totalStr} · ${count} imgs · $${price.toFixed(3)}/img`;
}

export function typeLabel(type: string, beds: number): string {
  if (type === 'studio') return 'Studio';
  if (type === 'penthouse') return 'Penthouse';
  return `${beds}-Bedroom`;
}

export function isPdf(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf');
}
