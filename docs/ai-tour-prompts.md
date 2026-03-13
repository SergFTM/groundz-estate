# AI Floor Tour — Image Generation Prompts

## Overview

Each unit gets **10–20 AI-rendered images** covering every room from a natural walking perspective.
Images are stored as a JSON array in `Unit.tourImages`:

```json
[
  { "url": "/images/tours/sun-101/01-entrance.jpg", "label": "Entrance Hall" },
  { "url": "/images/tours/sun-101/02-living.jpg",   "label": "Living Room" },
  ...
]
```

Place generated images in `static/images/tours/<unit-code>/`.

---

## Base Style Prompt (append to every room prompt)

```
Architectural interior render, photorealistic, daytime Mediterranean light,
white walls, light oak floors, minimalist luxury furniture, no people,
wide-angle lens (24mm), sharp focus, high resolution.
Style: contemporary Cyprus residential, clean lines, warm neutral palette.
```

---

## Sungardo — Unit SUN-101 (2-Bed, 83.4 m²)

### Room Sequence

| # | Label | Prompt Fragment |
|---|-------|----------------|
| 01 | Entrance Hall | `Compact entrance hallway 3.2m × 1.8m, white coat hooks, light oak console table, view toward open-plan living area` |
| 02 | Living Room | `Open-plan living room 5.8m × 4.1m, large sliding glass doors to covered veranda, sea glimpse, L-shape sofa, low coffee table` |
| 03 | Living — Veranda View | `Same living room angle looking toward covered veranda 10.5 m², outdoor lounge chair, Mediterranean garden visible` |
| 04 | Dining Area | `Dining corner adjacent to kitchen, round table for 4, pendant light above, open kitchen behind` |
| 05 | Kitchen | `Modern kitchen 2.9m × 2.4m, island counter, stone backsplash, integrated appliances, view into dining area` |
| 06 | Corridor | `Short corridor connecting living area to bedrooms, built-in storage niche, warm indirect lighting` |
| 07 | Master Bedroom | `Master bedroom 3.8m × 3.5m, king bed, floor-to-ceiling wardrobe, window overlooking garden` |
| 08 | Master Bathroom | `En-suite bathroom 2.2m × 1.9m, walk-in shower, floating vanity, large format tiles, skylight` |
| 09 | Bedroom 2 | `Second bedroom 3.1m × 2.8m, twin beds or double, built-in wardrobe, bright window` |
| 10 | Main Bathroom | `Family bathroom 2.0m × 1.9m, bathtub + shower, wall-hung toilet, chrome fixtures` |
| 11 | Covered Veranda | `Covered veranda 10.5 m², teak outdoor furniture, view toward Mouttagiaka coastline, afternoon light` |
| 12 | Storage Room | `Utility / storage room 3.5 m², shelving, washer-dryer niche` |

---

## Sungardo — Unit SUN-102 / SUN-202 (3-Bed, 114.8 m²)

| # | Label | Prompt Fragment |
|---|-------|----------------|
| 01 | Entrance Hall | `Entrance hall 3.5m × 1.9m, built-in shoe cabinet, view toward spacious living area` |
| 02 | Living Room | `Generous living room 6.4m × 4.8m, panoramic sliding doors, sectional sofa, statement rug` |
| 03 | Veranda — Day | `Covered veranda 12.8 m², morning light, Mediterranean landscape, outdoor dining set for 4` |
| 04 | Veranda — Dusk | `Same veranda at golden hour, warm ambient light, Limassol coast in background` |
| 05 | Dining Room | `Dining room 3.8m × 3.2m, rectangular table for 6, designer pendant cluster` |
| 06 | Kitchen | `Kitchen 3.4m × 2.8m, marble island, top-tier appliances, open shelving with ceramics` |
| 07 | Corridor | `Central corridor 4.2m long, doors to three bedrooms, ambient floor lighting` |
| 08 | Master Bedroom | `Master bedroom 4.2m × 3.8m, super-king bed, dressing area, double wardrobe, sea-view window` |
| 09 | Master En-Suite | `Master en-suite 2.8m × 2.0m, double vanity, rain shower, heated towel rail, large tiles` |
| 10 | Bedroom 2 | `Second bedroom 3.4m × 3.1m, queen bed, study desk area, garden-facing window` |
| 11 | Bedroom 3 | `Third bedroom 3.1m × 2.9m, single/twin configuration, built-in wardrobe` |
| 12 | Family Bathroom | `Family bathroom 2.4m × 2.0m, freestanding bathtub, separate shower cubicle` |
| 13 | Guest WC | `Compact guest WC 1.8m × 1.2m, minimal wall-hung fixtures` |
| 14 | Covered Veranda — Wide | `Full-width veranda shot, outdoor kitchen counter, pergola shadow patterns, afternoon` |
| 15 | Storage / Utility | `Storage room 4.2 m², built-in shelving, utility sink, washing machine` |

---

## Seeding `tourImages` — Example

After generating images, update `prisma/seed.ts` Sungardo unit entries:

```typescript
prisma.unit.create({
  data: {
    projectId: sungardo.id,
    code: 'SUN-101',
    type: '2bed',
    bedrooms: 2,
    floor: 1,
    areaSqm: 83,
    price: 430000,
    status: 'available',
    tourImages: JSON.stringify([
      { url: '/images/tours/sun-101/01-entrance.jpg',  label: 'Entrance Hall' },
      { url: '/images/tours/sun-101/02-living.jpg',    label: 'Living Room' },
      { url: '/images/tours/sun-101/03-veranda.jpg',   label: 'Covered Veranda' },
      { url: '/images/tours/sun-101/04-dining.jpg',    label: 'Dining Area' },
      { url: '/images/tours/sun-101/05-kitchen.jpg',   label: 'Kitchen' },
      { url: '/images/tours/sun-101/06-master-bed.jpg',label: 'Master Bedroom' },
      { url: '/images/tours/sun-101/07-master-bath.jpg','Master En-Suite' },
      { url: '/images/tours/sun-101/08-bed2.jpg',      label: 'Bedroom 2' },
      { url: '/images/tours/sun-101/09-bathroom.jpg',  label: 'Main Bathroom' },
    ]),
  },
}),
```

---

## Recommended AI Tools

| Tool | Notes |
|------|-------|
| **Midjourney v6** | Best photorealism for interiors; use `--ar 16:9 --style raw` |
| **DALL-E 3** | Good for consistent style; batch via API |
| **Stable Diffusion XL** | Self-hosted, cheapest at scale; use interior LoRA |
| **Adobe Firefly** | Commercial-safe licensing |

Render at minimum **1920×1080** (16:9). Save as optimised JPEG (quality 85).
