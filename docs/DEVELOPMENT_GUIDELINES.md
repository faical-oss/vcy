# Development Guidelines

## Commands (verified in `package.json` / `README.md`)
```bash
nvm use                 # .nvmrc = 22 (locally Node 22 was not installed; v26 worked and satisfies engines >=22.12)
npm install
cp .env.example .env.local   # real values never go in git or docs
npm run dev             # http://localhost:3000, or 3001 when 3000 is busy
npm run typecheck       # next typegen && tsc --noEmit
npm run lint            # eslint incl. layering rules
npm run lint:fix
npm test                # vitest run (src/**/*.test.ts, node env); npm run test:watch; npm run test:e2e (after npm run build; starts the built server on E2E_PORT, default 3199)
npm run build           # then npm run start
```
Not configured: Prettier, Playwright (`e2e/` is the server-level Vitest suite). Do not document or run commands that do not exist.

**Do not run `npm run build` while `npm run dev` is running** (both use `.next`): stop the dev server, build, restart. Stop background dev servers with the task manager, not `pkill`.

## Workflow for a UI change
1. Read the relevant `docs/` file and the existing component(s).
2. Inspect the original site's DOM/computed styles for the same element (browser JS: `getComputedStyle`, `getBoundingClientRect`, class names). Prefer measuring to eyeballing.
3. Implement with tokens (`globals.css`) and existing primitives (`components/ui`, `cn()`), data via props from the fixtures.
4. Compare at the **same viewport** on both sites (e.g. 1440, 768, 390): section heights, text styles (font size/weight/line-height/letter-spacing/color), element rects. A useful method: dump a deduplicated list of `text | computed style` from both pages and diff.
5. Check the console, horizontal overflow (`document.documentElement.scrollWidth === innerWidth`) and broken images (`naturalWidth === 0`).
6. Run typecheck, lint, tests, build.

### Responsive checks
Use the browser pane's `resize_window` (1440x900, 768x1024, 390x844) and reload after resizing (JS-gated layouts). Reset to `desktop` afterwards. Verify: header fits at 1024 (no overflow), carousels show whole cards (`--cols` 1/2/4 or 1/2/3), hero and popular chips wrap, mobile menu accordion, marquee/strip behavior.

### Tooling gotchas
- **Dev server serves stale CSS after editing `@theme` values** in `globals.css` (e.g. line-heights): restart `npm run dev` and re-check computed values.
- **tailwind-merge and custom font sizes:** new `--text-*` tokens must be added to `src/helpers/cn.ts` or classes silently disappear.
- The built-in browser pane does not tick animation frames/timeline (animations appear frozen): verify CSS animations by inspecting `getAnimations()`/keyframes, and ask the user to confirm motion/hover visually.
- Smooth scroll and CSS `scroll-snap` can be tested by setting `scrollLeft` with `scroll-behavior: auto` and reading where it lands.
- `localhost:3000` may be used by another process; use the port Next prints.

## Coding standards
- Follow the existing architecture and naming: kebab-case files, `PascalCase` components, one component per file in the matching folder, named exports.
- Components are presentational; interactive ones are `"use client"` only when needed (carousels, menus, favorite button, filters, newsletter form). Server components by default.
- All contracts in `src/interfaces`; use `import type`; no `any`.
- Styling: Tailwind utilities with tokens; `cn()` from `src/helpers/cn.ts` for conditional classes; `cva` for variants (see `ui/button.tsx`). No raw hex or ad-hoc font sizes when a token exists; add a token only for a verified value from the original.
- Reuse before creating: `Container`, `SectionHeading`, `SectionTag`, `Pill`, `Price`, `Rating`, `FavoriteButton`, `ImageCarousel`, `CardCarousel`, `ButtonLink`, `IconButton`, `Input`, `SunOrnament`, `Logo`.
- No new dependencies without a clear need. No duplicated logic. Keep components small. Do not add abstractions "just in case".
- Accessibility: keep skip link, labels, `aria-*` on menus/carousels/buttons, keyboard support, reduced-motion handling; decorative icons `aria-hidden`.
- Preserve existing behavior when editing; do not touch unrelated pages.
- Tests: Vitest for helpers/services/mocks next to the code (`*.test.ts`). Component tests (`*.test.tsx`, jsdom) and the server-level e2e suite (`e2e/`) exist for the pages that have them.
