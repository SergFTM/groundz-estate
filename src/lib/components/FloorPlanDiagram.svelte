<script lang="ts">
  interface Room {
    x: number; y: number; w: number; h: number;
    label: string;
    sub?: string;
    fill: string;
  }

  interface Layout { vw: number; vh: number; rooms: Room[] }

  interface Props { unitType: string; areaSqm: number; }
  let { unitType, areaSqm }: Props = $props();

  const F = {
    outdoor: '#d8ead2',
    living:  '#f7f4ef',
    bedroom: '#eeeae2',
    bath:    '#e4eef6',
    kitchen: '#f4f0e6',
    hall:    '#ece8e0',
    service: '#e4e0d8',
  };

  const LAYOUTS: Record<string, Layout> = {
    '2bed': {
      vw: 280, vh: 340,
      rooms: [
        { x: 0,   y: 0,   w: 280, h: 55,  label: 'Veranda',      sub: '10.5 m²', fill: F.outdoor },
        { x: 0,   y: 55,  w: 175, h: 115, label: 'Living Room',   sub: '23.8 m²', fill: F.living  },
        { x: 175, y: 55,  w: 105, h: 75,  label: 'Kitchen',       sub: '7.0 m²',  fill: F.kitchen },
        { x: 175, y: 130, w: 105, h: 40,  label: 'Hall',          sub: '5.8 m²',  fill: F.hall    },
        { x: 0,   y: 170, w: 175, h: 80,  label: 'Dining Area',   sub: '10.5 m²', fill: F.living  },
        { x: 175, y: 170, w: 105, h: 90,  label: 'Bedroom 2',     sub: '8.7 m²',  fill: F.bedroom },
        { x: 175, y: 260, w: 105, h: 80,  label: 'Storage',       sub: '3.5 m²',  fill: F.service },
        { x: 0,   y: 250, w: 122, h: 90,  label: 'Master Bed',    sub: '13.3 m²', fill: F.bedroom },
        { x: 122, y: 250, w: 53,  h: 45,  label: 'En-Suite',      sub: '4.2 m²',  fill: F.bath    },
        { x: 122, y: 295, w: 53,  h: 45,  label: 'Bathroom',      sub: '3.8 m²',  fill: F.bath    },
      ],
    },

    '3bed': {
      vw: 310, vh: 380,
      rooms: [
        { x: 0,   y: 0,   w: 310, h: 58,  label: 'Veranda',       sub: '12.8 m²', fill: F.outdoor },
        { x: 0,   y: 58,  w: 195, h: 130, label: 'Living Room',    sub: '30.7 m²', fill: F.living  },
        { x: 195, y: 58,  w: 115, h: 90,  label: 'Kitchen',        sub: '9.5 m²',  fill: F.kitchen },
        { x: 195, y: 148, w: 115, h: 40,  label: 'Hall',           sub: '6.7 m²',  fill: F.hall    },
        { x: 0,   y: 188, w: 195, h: 90,  label: 'Dining Room',    sub: '12.2 m²', fill: F.living  },
        { x: 195, y: 188, w: 115, h: 90,  label: 'Bedroom 3',      sub: '9.0 m²',  fill: F.bedroom },
        { x: 0,   y: 278, w: 130, h: 102, label: 'Master Bed',     sub: '16.0 m²', fill: F.bedroom },
        { x: 130, y: 278, w: 60,  h: 55,  label: 'En-Suite',       sub: '5.6 m²',  fill: F.bath    },
        { x: 130, y: 333, w: 60,  h: 47,  label: 'Guest WC',       sub: '2.2 m²',  fill: F.bath    },
        { x: 190, y: 278, w: 120, h: 65,  label: 'Bedroom 2',      sub: '10.5 m²', fill: F.bedroom },
        { x: 190, y: 343, w: 120, h: 37,  label: 'Family Bath',    sub: '4.8 m²',  fill: F.bath    },
      ],
    },

    'studio': {
      vw: 220, vh: 240,
      rooms: [
        { x: 0,   y: 0,   w: 220, h: 40,  label: 'Balcony',        sub: '4.5 m²',  fill: F.outdoor },
        { x: 0,   y: 40,  w: 155, h: 150, label: 'Open Living',     sub: '27.0 m²', fill: F.living  },
        { x: 155, y: 40,  w: 65,  h: 70,  label: 'Kitchenette',     sub: '2.9 m²',  fill: F.kitchen },
        { x: 155, y: 110, w: 65,  h: 80,  label: 'Bathroom',        sub: '3.6 m²',  fill: F.bath    },
        { x: 0,   y: 190, w: 220, h: 50,  label: 'Entrance',        sub: '',         fill: F.hall    },
      ],
    },

    '1bed': {
      vw: 240, vh: 290,
      rooms: [
        { x: 0,   y: 0,   w: 240, h: 50,  label: 'Balcony',        sub: '6.5 m²',  fill: F.outdoor },
        { x: 0,   y: 50,  w: 150, h: 110, label: 'Living Room',     sub: '18.2 m²', fill: F.living  },
        { x: 150, y: 50,  w: 90,  h: 70,  label: 'Kitchen',         sub: '5.7 m²',  fill: F.kitchen },
        { x: 150, y: 120, w: 90,  h: 40,  label: 'Entrance Hall',   sub: '4.5 m²',  fill: F.hall    },
        { x: 0,   y: 160, w: 150, h: 130, label: 'Bedroom',         sub: '11.2 m²', fill: F.bedroom },
        { x: 150, y: 160, w: 90,  h: 130, label: 'Bathroom',        sub: '4.0 m²',  fill: F.bath    },
      ],
    },

    'penthouse': {
      vw: 340, vh: 400,
      rooms: [
        { x: 0,   y: 0,   w: 340, h: 70,  label: 'Rooftop Terrace', sub: '45 m²',   fill: F.outdoor },
        { x: 0,   y: 70,  w: 210, h: 140, label: 'Living Room',      sub: '52.7 m²', fill: F.living  },
        { x: 210, y: 70,  w: 130, h: 95,  label: 'Kitchen',          sub: '15.8 m²', fill: F.kitchen },
        { x: 210, y: 165, w: 130, h: 45,  label: 'Dining Room',      sub: '19.2 m²', fill: F.living  },
        { x: 0,   y: 210, w: 210, h: 90,  label: 'Dining Room',      sub: '19.2 m²', fill: F.living  },
        { x: 210, y: 210, w: 130, h: 90,  label: 'Home Office',      sub: '8.4 m²',  fill: F.bedroom },
        { x: 0,   y: 300, w: 145, h: 100, label: 'Master Suite',     sub: '27.0 m²', fill: F.bedroom },
        { x: 145, y: 300, w: 75,  h: 55,  label: 'Master Bath',      sub: '10.5 m²', fill: F.bath    },
        { x: 145, y: 355, w: 75,  h: 45,  label: 'Lobby',            sub: '10.0 m²', fill: F.hall    },
        { x: 220, y: 300, w: 120, h: 55,  label: 'Bedroom 2',        sub: '14.0 m²', fill: F.bedroom },
        { x: 220, y: 355, w: 120, h: 45,  label: 'Bedroom 3',        sub: '10.5 m²', fill: F.bedroom },
      ],
    },
  };

  const layout = $derived(LAYOUTS[unitType] ?? LAYOUTS['2bed']);

  // compass label
  const compassLabel: Record<string, string> = {
    '2bed': '2-Bedroom · Apartment',
    '3bed': '3-Bedroom · Apartment',
    'studio': 'Studio · Apartment',
    '1bed': '1-Bedroom · Apartment',
    'penthouse': 'Penthouse',
  };
</script>

<div class="fp-wrap">
  <div class="fp-compass">
    <span>{compassLabel[unitType] ?? unitType}</span>
    <span class="fp-area">{areaSqm} m² total</span>
    <span class="fp-north">N ↑</span>
  </div>

  <div class="fp-svg-wrap">
    <svg
      viewBox="0 0 {layout.vw} {layout.vh}"
      xmlns="http://www.w3.org/2000/svg"
      class="fp-svg"
    >
      <!-- Outer apartment boundary (solid) -->
      <rect x="0" y="0" width={layout.vw} height={layout.vh}
        fill="none" stroke="#3a3830" stroke-width="2.5" />

      <!-- Rooms -->
      {#each layout.rooms as room}
        <rect
          x={room.x} y={room.y} width={room.w} height={room.h}
          fill={room.fill}
          stroke="#3a3830"
          stroke-width="0.8"
        />

        <!-- Room label -->
        <text
          x={room.x + room.w / 2}
          y={room.y + room.h / 2 - (room.sub ? 5 : 0)}
          text-anchor="middle"
          dominant-baseline="middle"
          class="fp-room-label"
          font-size={room.w < 60 || room.h < 36 ? 6 : 8}
        >{room.label}</text>

        {#if room.sub && room.h > 28 && room.w > 40}
          <text
            x={room.x + room.w / 2}
            y={room.y + room.h / 2 + 8}
            text-anchor="middle"
            dominant-baseline="middle"
            class="fp-room-sub"
            font-size="6"
          >{room.sub}</text>
        {/if}

        <!-- Outdoor hatching for veranda/balcony/terrace -->
        {#if room.fill === F.outdoor}
          {#each Array.from({ length: Math.ceil((room.w + room.h) / 8) }) as _, i}
            {@const offset = i * 8}
            <line
              x1={room.x + Math.max(0, offset - room.h)}
              y1={room.y + Math.min(room.h, offset)}
              x2={room.x + Math.min(room.w, offset)}
              y2={room.y + Math.max(0, offset - room.w)}
              stroke="#8aaa84" stroke-width="0.5" stroke-dasharray="none"
              opacity="0.5"
            />
          {/each}
        {/if}
      {/each}

      <!-- Wall thickness: redraw outer border on top -->
      <rect x="0" y="0" width={layout.vw} height={layout.vh}
        fill="none" stroke="#3a3830" stroke-width="3" />

      <!-- Dimension arrows: width -->
      <line x1="0" y1={layout.vh + 12} x2={layout.vw} y2={layout.vh + 12}
        stroke="#8a8678" stroke-width="0.7" />
      <line x1="0" y1={layout.vh + 8} x2="0" y2={layout.vh + 16}
        stroke="#8a8678" stroke-width="0.7" />
      <line x1={layout.vw} y1={layout.vh + 8} x2={layout.vw} y2={layout.vh + 16}
        stroke="#8a8678" stroke-width="0.7" />
      <text x={layout.vw / 2} y={layout.vh + 20} text-anchor="middle"
        font-size="7" fill="#8a8678" font-family="monospace">
        {unitType === '3bed' ? '~11.0m' : unitType === 'penthouse' ? '~12.5m' : unitType === 'studio' ? '~7.5m' : '~8.5m'}
      </text>
    </svg>
  </div>

  <!-- Legend -->
  <div class="fp-legend">
    {#each [
      { c: F.living,  l: 'Living / Dining' },
      { c: F.bedroom, l: 'Bedrooms' },
      { c: F.bath,    l: 'Bathrooms' },
      { c: F.kitchen, l: 'Kitchen' },
      { c: F.outdoor, l: 'Outdoor' },
    ] as item}
      <span class="fp-leg-item">
        <span class="fp-leg-dot" style="background:{item.c};border:1px solid #ccc"></span>
        {item.l}
      </span>
    {/each}
  </div>
</div>

<style>
  .fp-wrap {
    padding: var(--space-4) var(--space-5);
  }

  .fp-compass {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
    font-size: var(--text-xs);
    color: var(--color-text-body);
  }

  .fp-area {
    font-weight: 700;
    color: var(--color-accent);
  }

  .fp-north {
    margin-left: auto;
    font-size: 10px;
    font-weight: 700;
    color: var(--color-text-body);
    opacity: 0.5;
  }

  .fp-svg-wrap {
    background: #faf9f7;
    border: 1px solid rgba(0,0,0,0.06);
    border-radius: var(--radius-sm);
    padding: var(--space-3) var(--space-3) var(--space-5);
    display: flex;
    justify-content: center;
  }

  .fp-svg {
    width: 100%;
    max-width: 340px;
    height: auto;
    display: block;
  }

  .fp-room-label {
    fill: #2a2820;
    font-family: 'Helvetica Neue', sans-serif;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .fp-room-sub {
    fill: #7a7a70;
    font-family: 'Helvetica Neue', sans-serif;
  }

  .fp-legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
    margin-top: var(--space-3);
  }

  .fp-leg-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: 10px;
    color: var(--color-text-body);
  }

  .fp-leg-dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }
</style>
