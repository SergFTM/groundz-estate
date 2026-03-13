# Image Map — Scraped Screenshots

> Screenshots taken from develta.cy in March 2026.
> These are temporary stand-ins. Replace with high-quality renders/photos when available.

---

## Scraped Screenshots (`static/images/scraped/`)

| Filename | What It Shows | Quality Notes |
|----------|---------------|---------------|
| `homepage.jpeg` | Hero — Symphony Residence complex, daytime aerial/wide shot | Good as hero background |
| `sungardo.jpeg` | Sungardo building — white modern low-rise with green rooftop gardens | Best quality; use for Sungardo project card & detail |
| `antigone-court.jpeg` | "Coming soon" page — same Sungardo building render (reused on site) | Placeholder only |
| `symphony-residence.jpeg` | "Coming soon" page — minimal content screenshot | Not usable as image |
| `about-us.jpeg` | Symphony Residence complex at night/dusk with outdoor lighting | Beautiful; use for Symphony Residence or hero |

---

## Project Image Assignments (`static/images/projects/`)

| Project Slug | Current File | Source Screenshot | Suggested Replacement |
|---|---|---|---|
| `sungardo` | `sungardo.jpeg` | `scraped/sungardo.jpeg` | High-res render or photo of Sungardo |
| `symphony-residence` | `symphony-residence.jpeg` | `scraped/about-us.jpeg` (night render) | Official Symphony Residence render |
| `antigone-court` | `antigone-court.jpeg` | `scraped/antigone-court.jpeg` (Sungardo reuse) | Actual Antigone Court render |
| `cascada-residence` | `cascada-residence.jpeg` | `scraped/antigone-court.jpeg` (reused) | Cascada Residence render |
| `ptolemy-studios` | `ptolemy-studios.jpeg` | `scraped/antigone-court.jpeg` (reused) | Ptolemy Studios photo |

**Note:** Antigone Court, Cascada Residence, and Ptolemy Studios all currently use the same screenshot as placeholder. Replace individually with proper renders.

---

## Code Keys

When referencing images in code/templates, use these paths:

```typescript
// Project card images
'/images/projects/sungardo.jpeg'          // Sungardo
'/images/projects/symphony-residence.jpeg' // Symphony Residence
'/images/projects/antigone-court.jpeg'    // Antigone Court
'/images/projects/cascada-residence.jpeg' // Cascada Residence
'/images/projects/ptolemy-studios.jpeg'   // Ptolemy Studios

// Hero / about
'/images/scraped/homepage.jpeg'           // Daytime complex wide shot
'/images/scraped/about-us.jpeg'           // Night render of Symphony complex
```

---

## Replacement Checklist

- [ ] `sungardo.jpeg` — request high-res render from architect
- [ ] `symphony-residence.jpeg` — request official project render
- [ ] `antigone-court.jpeg` — request render (project not yet announced publicly)
- [ ] `cascada-residence.jpeg` — request render
- [ ] `ptolemy-studios.jpeg` — request completed project photos
- [ ] Hero background — commission professional drone shot of Limassol seafront
