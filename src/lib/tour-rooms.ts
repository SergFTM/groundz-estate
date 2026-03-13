export interface RoomSpec {
  label: string;
  fragment: string;
  dims?: string; // "W × D m"
  areaSqm?: number;
}

export const ROOM_SCHEDULES: Record<string, RoomSpec[]> = {
  '2bed': [
    { label: 'Entrance Hall',   dims: '3.2 × 1.8 m', areaSqm: 5.8,  fragment: 'Compact entrance hallway 3.2m × 1.8m, white coat hooks, light oak console table, view toward open-plan living area' },
    { label: 'Living Room',     dims: '5.8 × 4.1 m', areaSqm: 23.8, fragment: 'Open-plan living room 5.8m × 4.1m, large sliding glass doors to covered veranda, sea glimpse, L-shape sofa, low coffee table' },
    { label: 'Covered Veranda', dims: '10.5 m²',      areaSqm: 10.5, fragment: 'Covered veranda 10.5 m², Mediterranean garden visible, outdoor lounge chair, afternoon light, teak furniture' },
    { label: 'Dining Area',     dims: '3.5 × 3.0 m', areaSqm: 10.5, fragment: 'Dining corner adjacent to kitchen, round table for 4, pendant light above, open kitchen behind' },
    { label: 'Kitchen',         dims: '2.9 × 2.4 m', areaSqm: 7.0,  fragment: 'Modern kitchen 2.9m × 2.4m, island counter, stone backsplash, integrated appliances, view into dining area' },
    { label: 'Master Bedroom',  dims: '3.8 × 3.5 m', areaSqm: 13.3, fragment: 'Master bedroom 3.8m × 3.5m, king bed, floor-to-ceiling wardrobe, window overlooking garden' },
    { label: 'Master En-Suite', dims: '2.2 × 1.9 m', areaSqm: 4.2,  fragment: 'En-suite bathroom 2.2m × 1.9m, walk-in shower, floating vanity, large format tiles, skylight' },
    { label: 'Bedroom 2',       dims: '3.1 × 2.8 m', areaSqm: 8.7,  fragment: 'Second bedroom 3.1m × 2.8m, twin beds, built-in wardrobe, bright window' },
    { label: 'Main Bathroom',   dims: '2.0 × 1.9 m', areaSqm: 3.8,  fragment: 'Family bathroom 2.0m × 1.9m, bathtub with shower, wall-hung toilet, chrome fixtures' },
    { label: 'Storage Room',    dims: '3.5 m²',       areaSqm: 3.5,  fragment: 'Utility storage room 3.5 m², open shelving, washer-dryer niche, natural light' },
  ],

  '3bed': [
    { label: 'Entrance Hall',     dims: '3.5 × 1.9 m', areaSqm: 6.7,  fragment: 'Entrance hall 3.5m × 1.9m, built-in shoe cabinet, view toward spacious living area' },
    { label: 'Living Room',       dims: '6.4 × 4.8 m', areaSqm: 30.7, fragment: 'Generous living room 6.4m × 4.8m, panoramic sliding doors, sectional sofa, statement rug' },
    { label: 'Covered Veranda',   dims: '12.8 m²',      areaSqm: 12.8, fragment: 'Covered veranda 12.8 m², outdoor dining set for 4, Mediterranean landscape, afternoon light' },
    { label: 'Veranda — Dusk',    dims: '12.8 m²',      areaSqm: 12.8, fragment: 'Same covered veranda at golden hour, warm ambient light, Limassol coast in background' },
    { label: 'Dining Room',       dims: '3.8 × 3.2 m', areaSqm: 12.2, fragment: 'Dining room 3.8m × 3.2m, rectangular table for 6, designer pendant cluster' },
    { label: 'Kitchen',           dims: '3.4 × 2.8 m', areaSqm: 9.5,  fragment: 'Kitchen 3.4m × 2.8m, marble island, top-tier appliances, open shelving with ceramics' },
    { label: 'Master Bedroom',    dims: '4.2 × 3.8 m', areaSqm: 16.0, fragment: 'Master bedroom 4.2m × 3.8m, super-king bed, dressing area, double wardrobe, sea-view window' },
    { label: 'Master En-Suite',   dims: '2.8 × 2.0 m', areaSqm: 5.6,  fragment: 'Master en-suite 2.8m × 2.0m, double vanity, rain shower, heated towel rail, large format tiles' },
    { label: 'Bedroom 2',         dims: '3.4 × 3.1 m', areaSqm: 10.5, fragment: 'Second bedroom 3.4m × 3.1m, queen bed, study desk area, garden-facing window' },
    { label: 'Bedroom 3',         dims: '3.1 × 2.9 m', areaSqm: 9.0,  fragment: 'Third bedroom 3.1m × 2.9m, single-twin configuration, built-in wardrobe' },
    { label: 'Family Bathroom',   dims: '2.4 × 2.0 m', areaSqm: 4.8,  fragment: 'Family bathroom 2.4m × 2.0m, freestanding bathtub, separate shower cubicle' },
    { label: 'Guest WC',          dims: '1.8 × 1.2 m', areaSqm: 2.2,  fragment: 'Compact guest WC 1.8m × 1.2m, minimal wall-hung fixtures' },
    { label: 'Storage / Utility', dims: '4.2 m²',       areaSqm: 4.2,  fragment: 'Storage room 4.2 m², built-in shelving, utility sink, washing machine' },
  ],

  'studio': [
    { label: 'Open Living',     dims: '6.0 × 4.5 m', areaSqm: 27.0, fragment: 'Open-plan studio 6.0m × 4.5m, living-sleeping zone, kitchenette along one wall, large window' },
    { label: 'Kitchenette',     dims: '2.4 × 1.2 m', areaSqm: 2.9,  fragment: 'Integrated kitchenette 2.4m × 1.2m, induction hob, compact fridge, stone countertop' },
    { label: 'Bathroom',        dims: '2.0 × 1.8 m', areaSqm: 3.6,  fragment: 'Studio bathroom 2.0m × 1.8m, walk-in shower, wall-hung toilet, floating vanity' },
    { label: 'Balcony',         dims: '4.5 m²',       areaSqm: 4.5,  fragment: 'Private balcony 4.5 m², folding chair, garden view, afternoon light' },
  ],

  '1bed': [
    { label: 'Entrance Hall',  dims: '2.8 × 1.6 m', areaSqm: 4.5,  fragment: 'Entrance hallway 2.8m × 1.6m, wall hooks, view to living area' },
    { label: 'Living Room',    dims: '4.8 × 3.8 m', areaSqm: 18.2, fragment: 'Living room 4.8m × 3.8m, sliding doors to balcony, sofa, TV unit' },
    { label: 'Balcony',        dims: '6.5 m²',       areaSqm: 6.5,  fragment: 'Covered balcony 6.5 m², outdoor chair, sea or garden view' },
    { label: 'Kitchen',        dims: '2.6 × 2.2 m', areaSqm: 5.7,  fragment: 'Kitchen 2.6m × 2.2m, integrated appliances, stone countertop, open to dining' },
    { label: 'Bedroom',        dims: '3.5 × 3.2 m', areaSqm: 11.2, fragment: 'Bedroom 3.5m × 3.2m, king bed, built-in wardrobe, garden-facing window' },
    { label: 'Bathroom',       dims: '2.1 × 1.9 m', areaSqm: 4.0,  fragment: 'Bathroom 2.1m × 1.9m, walk-in shower, floating vanity, large tiles' },
  ],

  'penthouse': [
    { label: 'Entrance Lobby',        dims: '4.0 × 2.5 m', areaSqm: 10.0, fragment: 'Penthouse private lobby, double-height ceiling, art niche, view to open-plan living' },
    { label: 'Living Room',           dims: '8.5 × 6.2 m', areaSqm: 52.7, fragment: 'Penthouse living room 8.5m × 6.2m, panoramic floor-to-ceiling windows, sea view, grand sectional' },
    { label: 'Rooftop Terrace',       dims: '45 m²',        areaSqm: 45.0, fragment: 'Private rooftop terrace 45 m², infinity pool edge, panoramic Limassol coastline, sunset' },
    { label: 'Dining Room',           dims: '4.8 × 4.0 m', areaSqm: 19.2, fragment: 'Formal dining room 4.8m × 4.0m, table for 8, statement chandelier, gallery wall' },
    { label: 'Kitchen',               dims: '4.5 × 3.5 m', areaSqm: 15.8, fragment: 'Bespoke kitchen 4.5m × 3.5m, professional grade appliances, waterfall island, wine fridge' },
    { label: 'Master Suite',          dims: '6.0 × 4.5 m', areaSqm: 27.0, fragment: 'Master suite 6.0m × 4.5m, super-king bed, dressing room visible, sea panorama' },
    { label: 'Master Bathroom',       dims: '3.5 × 3.0 m', areaSqm: 10.5, fragment: 'Spa bathroom 3.5m × 3.0m, freestanding soaking tub with sea view, double shower' },
    { label: 'Bedroom 2',             dims: '4.0 × 3.5 m', areaSqm: 14.0, fragment: 'Guest bedroom 4.0m × 3.5m, king bed, terrace access, walk-in wardrobe' },
    { label: 'Bedroom 3',             dims: '3.5 × 3.0 m', areaSqm: 10.5, fragment: 'Third bedroom 3.5m × 3.0m, queen bed, en-suite shower room' },
    { label: 'Home Office',           dims: '3.0 × 2.8 m', areaSqm: 8.4,  fragment: 'Home office 3.0m × 2.8m, built-in bookshelves, designer desk, garden view' },
    { label: 'Rooftop Terrace Night', dims: '45 m²',        areaSqm: 45.0, fragment: 'Rooftop terrace at night, city lights below, illuminated pool, outdoor lounge' },
  ],
};

export function getRooms(unitType: string): RoomSpec[] {
  return ROOM_SCHEDULES[unitType] ?? ROOM_SCHEDULES['2bed'];
}
