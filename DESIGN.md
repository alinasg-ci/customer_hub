# Design System — Warm Clay (Client Hub)

**Single source of truth for the app's visual language.**

Every page, component, and future fix MUST follow this document. Global style changes happen in exactly one place: `src/app/globals.css` (`@theme` block + `@layer utilities` block). Never hard-code colors, shadows, or radii in component files — only reference the tokens and utility classes defined here.

The reference page for "what the app should look like" is `/overview` (`src/app/(authenticated)/overview/page.tsx` + `src/modules/overview/portfolio/**`). When in doubt, open that page and mirror its pattern.

---

## 1. How to make a global style change

| You want to change… | Edit this file | What to edit |
|---|---|---|
| A color value (e.g., make matcha more teal) | `src/app/globals.css` | The `--color-*` variable inside `@theme { }` |
| Spacing / radius scale | `src/app/globals.css` | `--radius-clay*` variables |
| Shadow depth / hover lift | `src/app/globals.css` | `--shadow-clay`, `--shadow-hard*` |
| Typography (font, stylistic sets) | `src/app/globals.css` | `--font-sans`, `--font-mono`, and `body { font-feature-settings }` |
| Hover tilt angle / animation curve | `src/app/globals.css` | `.clay-card:hover` and `.clay-btn:hover` inside `@layer utilities` |
| Card chrome (border, padding, stripe) | `src/app/globals.css` | `.clay-card`, `.clay-card-sm`, `.clay-card-static` in `@layer utilities` |
| Add a new reusable pattern | `src/app/globals.css` | New class under `@layer utilities`, then document it in this file |

**Rule:** If a change is not in `globals.css`, it is not global. Component-level overrides are a smell — they drift over time.

---

## 2. Design tokens (all defined in `globals.css @theme`)

### Canvas

| Token | Hex | When to use |
|---|---|---|
| `cream` | `#faf9f7` | Page background — the warm paper canvas. **Never use pure white (#fff) for page bg.** |
| `cream-dark` | `#f5f3ef` | Header row inside tables, secondary canvas areas |

### Oat (warm neutrals — borders + surfaces)

| Token | Hex | Role |
|---|---|---|
| `oat-100` | `#f5f0e8` | Subtle background highlights, button ghost hover |
| `oat-200` | `#eee9df` | Dividers, subtle row separators |
| `oat-300` | `#dad4c8` | **Primary border** for every card, input, divider |
| `oat-400` | `#c4bdb0` | Hover-darker border |
| `oat-500` | `#9f9b93` | Secondary/muted text, `clay-label` color |

### Charcoal (text hierarchy)

| Token | Hex | Role |
|---|---|---|
| `charcoal-300` | `#717989` | Tertiary text, form label |
| `charcoal-500` | `#55534e` | Secondary/body text |
| `charcoal-700` | `#333333` | Strong secondary text, link hover |
| `charcoal-900` | `#1a1a1a` | Darkest near-black (button hover) |

**Primary text color is `#000` (Tailwind `text-black`)**, not charcoal. Charcoal is for secondary copy.

### Swatch palette (semantic colors)

Each swatch has a role. Never use a swatch outside its role.

| Swatch | Shades available | Semantic role |
|---|---|---|
| **Matcha** (green) | `300, 500, 600, 700, 800` | Growth, success, on-track, positive delta, default primary accent |
| **Slushie** (cyan) | `300, 500, 800` | Informational, onboarding, pending, calendar |
| **Lemon** (gold) | `400, 500, 700, 800` | Warnings, stickers, highlight accents |
| **Ube** (purple) | `300, 500, 800, 900` | Playful contrast, sticky notes, archive |
| **Pomegranate** (red) | `300, 400, 600, 700` | Errors, over-cap, negative delta, destructive |
| **Blueberry** (navy) | `500, 800` | Data accents, avatars |
| **Dragonfruit** (pink) | `500` | Avatar accent only |

**Alpha modifiers work** — `bg-matcha-300/20`, `border-pomegranate-400/30`, etc. Always prefer a defined shade + alpha over inventing a new shade.

### Shadows

| Token | Value | Use |
|---|---|---|
| `shadow-clay` | `0 1px 1px rgba(0,0,0,0.1), inset 0 -1px 1px rgba(0,0,0,0.04), 0 -0.5px 1px rgba(0,0,0,0.05)` | Default card shadow — stamped-into-clay feel |
| `shadow-clay-lg` | larger 3-layer | Floating elements (recording indicator) |
| `shadow-hard-sm` | `-4px 4px 0 #000` | Small hard offset on hover (buttons, small cards) |
| `shadow-hard` | `-7px 7px 0 #000` | Large hard offset on hover (feature cards) |

**Never use blurred ambient shadows** (`shadow-xl`, `shadow-lg` from Tailwind default). The signature is hard offset + multi-layer inset.

### Radius

| Token | Value | Use |
|---|---|---|
| `clay-sm` | `4px` | Inputs |
| `clay` | `12px` | Small cards, buttons, chips |
| `clay-lg` | `24px` | Feature cards |
| `clay-xl` | `40px` | Section containers |
| `pill` | `9999px` | Pills, stickers, the recording indicator |

### Typography

| Family | Token | Role |
|---|---|---|
| **DM Sans** | `--font-sans` | Default body, headings — with `ss01` + `ss03` stylistic sets enabled globally on `body` |
| **Space Mono** | `--font-mono` | Timestamps, IDs, numeric metadata, `clay-label`, `clay-mono` |

**Hero scale:** `clamp(44px, 6vw, 72px)` with `letter-spacing: -0.03em`, `line-height: 0.98`, weight 600.
**Section heading:** 20–24px weight 600.
**Body:** 15px regular in `charcoal-500`.
**Metadata:** 11–13px `clay-mono` or `clay-label`.

---

## 3. Utility classes (defined in `globals.css @layer utilities`)

These are the building blocks. Compose pages from these — do not re-invent.

| Class | What it is | Use when |
|---|---|---|
| `clay-card` | White surface, oat-300 border, `radius-clay-lg`, shadow-clay, tilts -1.5° + hard-shadow on hover | **Interactive/clickable cards** (client cards, project cards, feature tiles) |
| `clay-card-sm` | Smaller variant (radius-clay, shadow-hard-sm on hover) | Compact cards in dense grids |
| `clay-card-static` | Same chrome as clay-card, no hover tilt | Non-interactive containers (settings sections, page-level wrappers, modals) |
| `clay-card-dashed` | White, dashed oat-300 border | Empty states, "add new" placeholders |
| `clay-section` | 40px radius wrapper | Large page-wide feature sections |
| `clay-input` | oat-300 border, 4px radius, black focus ring | **Every form input** |
| `clay-btn` | Base button — 12px radius, 220ms spring curve, tilts -4° on hover | Always pair with a variant |
| `clay-btn-primary` | Black bg, white text | Primary CTA (New Client, Save) |
| `clay-btn-secondary` | White bg, oat-300 border | Secondary/cancel |
| `clay-btn-ghost` | Transparent, charcoal-300 border, 4px radius | Icon buttons, low-emphasis |
| `clay-btn-danger` | Pomegranate bg | Destructive (Delete, Sign out) |
| `clay-label` | 11px uppercase, 1.08px tracking, oat-500 | **Column headers, metadata captions** (replaces custom `text-xs uppercase`) |
| `clay-mono` | Space Mono family | Timestamps, IDs, numeric values |
| `clay-hatch` | Diagonal 135° hatch overlay | Hover texture reveal (absolute overlay) |
| `clay-sticker` | Lemon 500 pill, 1.5px black border, rotated -6°, hard shadow | Count badges, "★ N active" accents |
| `clay-sticky-note` | Ube 800 bg, white text, hatch, hard shadow | Pinned notes, ephemeral callouts |

---

## 4. Page-level patterns (mandatory chrome)

Every top-level page (`src/app/(authenticated)/*/page.tsx`) uses the same four-part structure. This is the non-negotiable chrome.

### 4.1 Hero greeting (top of every page)

```tsx
<section className="relative mb-8">
  <div className="clay-label">{CONTEXT_LINE}</div>
  <h1
    className="my-2 font-semibold text-black"
    style={{
      fontSize: 'clamp(44px, 6vw, 72px)',
      lineHeight: 0.98,
      letterSpacing: '-0.03em',
      fontFeatureSettings: '"ss01","ss03"',
    }}
  >
    Your <em className="not-italic text-matcha-600">page-noun</em>.
  </h1>
  <p className="clay-mono mt-2 text-[13px] text-charcoal-500">
    {Primary metadata line, mono}
  </p>
  <div
    className="clay-sticker absolute right-2 top-2 hidden sm:inline-flex"
    style={{ transform: 'rotate(-6deg)' }}
  >
    ★ {live count}
  </div>
</section>
```

**Italic accent color by page role:**
- Primary / action pages → `text-matcha-600` (home, client detail)
- Informational → `text-slushie-500` (calendar)
- Warning / config → `text-lemon-700` (settings)
- Read-only / archival → `text-ube-500` (archive)
- Type-based (project page) → tint inline from project type

### 4.2 Colored top stripe on cards

Every major card (profile header, profitability, table wrapper, settings section) gets a **6px colored stripe** matching the content's semantic role. It's the strongest visual anchor of the system.

```tsx
<div className="clay-card-static overflow-hidden">
  <div className="h-[6px] bg-matcha-500" />   {/* or slushie / ube / pomegranate / lemon */}
  <div className="p-5">…</div>
</div>
```

### 4.3 Hatch overlays

Use `.clay-hatch` on hover reveals (cards) and on empty-state backgrounds. Always paired with `relative` on the container and `absolute inset-0` on the hatch div.

### 4.4 Empty states

Always feature a **lemon-sticker-style icon** (rotated -6°, 1.5px black border, hard-shadow-sm), a hatch overlay, and a primary CTA.

```tsx
<div className="clay-card-dashed relative flex flex-col items-center justify-center overflow-hidden py-16">
  <div className="clay-hatch absolute inset-0 opacity-50" />
  <div
    className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] border-[1.5px] border-black bg-lemon-500 shadow-[var(--shadow-hard-sm)]"
    style={{ transform: 'rotate(-6deg)' }}
  >
    <svg>…</svg>
  </div>
  <h3 className="relative text-base font-semibold text-black">Empty title</h3>
  <p className="relative mt-1 text-sm text-charcoal-500">Supporting copy.</p>
  <button className="clay-btn clay-btn-primary relative mt-5">CTA</button>
</div>
```

### 4.5 Tabs

Pill-bar tabs inside a card-dark canvas — not flat underline tabs:

```tsx
<div className="inline-flex gap-1 rounded-[12px] border border-oat-300 bg-cream-dark p-1">
  <button className={active
    ? 'bg-black text-white shadow-[var(--shadow-hard-sm)] rounded-[10px] px-3 py-2 ...'
    : 'text-charcoal-500 hover:bg-white hover:text-black rounded-[10px] px-3 py-2 ...'}>
    …
  </button>
</div>
```

### 4.6 Tables

Wrap every data table in `clay-card-static` + colored top stripe + `overflow-hidden`. Column headers use `clay-label clay-mono` on a `bg-cream-dark` row with `border-b border-oat-300`.

### 4.7 Error banners

```tsx
<div className="rounded-[12px] border border-pomegranate-400 bg-pomegranate-300/20 p-4">
  <p className="text-sm text-pomegranate-600">{error}</p>
</div>
```

### 4.8 Global recording indicator

Fixed top-center black pill with lemon "LIVE" chip, white project name, mono timer, white Stop button. Already implemented in `src/modules/recording/components/GlobalRecordingIndicator.tsx` — rendered once in `src/app/(authenticated)/layout.tsx`. Do not duplicate.

---

## 5. Checklist for a new page

- [ ] Hero section with `clay-label`, `clamp(44px, 6vw, 72px)` heading, italic matcha accent, mono sub-line
- [ ] Lemon sticker rotated -6° if there's a live count to flaunt
- [ ] Every major card uses `clay-card*` with a 6px colored top stripe
- [ ] Every input uses `clay-input`
- [ ] Every button uses `clay-btn` + variant
- [ ] Column headers use `clay-label clay-mono`
- [ ] Timestamps, IDs, numeric values use `clay-mono`
- [ ] Empty states use lemon-sticker icon + hatch overlay
- [ ] Error banners use `border-pomegranate-400 bg-pomegranate-300/20 text-pomegranate-600`
- [ ] No `slate-*`, `indigo-*`, `red-*`, `amber-*`, `emerald-*`, `purple-*` classes anywhere

## 6. Checklist for a new component

- [ ] Reads tokens via Tailwind classes (`text-charcoal-500`) or CSS vars (`var(--color-matcha-500)`) — never hex literals
- [ ] Uses a `clay-*` utility for chrome where one exists — does not re-invent borders/shadows
- [ ] Any bespoke CSS lives in the file's CSS Module, not as inline styles (exception: dynamic color/transform values)
- [ ] Hover state: tilt or border→black or hard-shadow — never a plain color dim
- [ ] Focus state visible for keyboard users (inputs get it automatically via `clay-input`)
- [ ] Supports the empty/loading/error triad if it fetches data

---

## 7. Do / Don't

### Do
- ✅ Reference tokens from `@theme` only
- ✅ Use `clay-*` utilities for chrome
- ✅ Compose hero + stripe + card + sticker + hatch for visual richness
- ✅ Mono for numeric data; uppercase `clay-label` for metadata captions
- ✅ `cream` page backgrounds, `white` card backgrounds
- ✅ Hard offset shadows on hover

### Don't
- ❌ Hard-code hex values in components
- ❌ Use `slate-*`, `indigo-*`, `red-*`, `amber-*`, `emerald-*`, `purple-*`, `sky-*`, `violet-*`
- ❌ Use blurred ambient shadows (`shadow-lg`, `shadow-xl`, `shadow-2xl`)
- ❌ Create a new radius, shadow, or color without adding it to `globals.css` `@theme`
- ❌ Skip the hero on a top-level page
- ❌ Flat "rounded-xl border bg-white p-5" cards — always use `clay-card*`
- ❌ `text-xs uppercase tracking-widest` — use `clay-label`
- ❌ Mix `charcoal-*` and `gray-*` (gray doesn't exist in theme)

---

## 8. Ownership & rules enforcement

**CLAUDE.md already says** `Styling: Tailwind CSS (utility-first, no custom CSS files unless absolutely necessary)`. This file overrides that with one exception: `globals.css` is the single allowed CSS module for shared utilities. Component-specific CSS Modules are allowed for overview-style rich layouts (see `src/modules/overview/portfolio/portfolio.module.css`) but must reference the same tokens.

**When adding a new pattern** that doesn't fit an existing utility: add the utility to `globals.css` `@layer utilities`, document it in §3 of this file, and rebase any one-off inline copy to use it.

**When removing or renaming a token:** search the whole repo first (`grep -r 'matcha-500'`), update every usage, then remove from `@theme`. Never leave dangling references — Tailwind v4 silently drops unknown shades.

---

## 9. Where to find real examples

| Pattern | File |
|---|---|
| Hero greeting + sticker | `src/modules/overview/portfolio/Hero.tsx` · `src/modules/clients/components/ClientList.tsx` |
| Colored top stripe card | `src/modules/profitability/components/ProfitabilityCard.tsx` |
| Colored KPI tiles with hatch | `src/modules/overview/portfolio/KpiTile.tsx` |
| Sticker + tilted accent | `.clay-sticker` rule in `globals.css` |
| Sticky note | `.clay-sticky-note` rule in `globals.css` |
| Recording indicator | `src/modules/recording/components/GlobalRecordingIndicator.tsx` |
| Empty state with hatch | `src/app/(authenticated)/client/[id]/page.tsx` (no-projects branch) |
| Tilted avatar swatch | `src/modules/clients/components/ClientList.tsx` (`getClientSwatch`) |
| Pill tab bar | `src/app/(authenticated)/client/[id]/project/[projectId]/page.tsx` |
