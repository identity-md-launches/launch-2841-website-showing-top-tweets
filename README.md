# Pond

A dark-green reading room for top tweets about Identity.md, with AI-equipped Pepe artwork. Search 12 sourced posts, filter four topics, sort by likes, reposts or date, save tweets locally, and share links to the originals.

The feed is a **dated snapshot**, not a live or exhaustive ranking of X. The interface discloses this beside the feed and in “About this feed.” Bookmarks stay in the current browser; there is no account or backend.

## Install, develop and preview

Requires Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

For the finished production site:

```sh
npm run typecheck
npm run build
npm run check:export
npm run preview
```

Open the local URL printed by Vite. `dist/index.html` and every runtime asset are included in this submission; any static host can serve the **contents of `dist/`**. Vite uses `base: './'`, assets are relative, and the saved view uses a hash, so a gateway subpath needs no route rewrites. Preview through HTTP rather than opening the file directly. No hosting or publication command was run.

## Validation

The final source was typechecked and built in a clean staging directory with the same source, configuration and lockfile, keeping dependencies outside this repository. The resulting export was copied into `dist/` and inspected under `/preview/`.

Actual final results on November 1, 2026:

| Check | Result |
| --- | --- |
| `npm ci` | Passed with the committed lockfile |
| `npm run typecheck` | Passed, no TypeScript errors |
| `npm run build` | Passed, Vite 8.3.5 |
| `npm run check:export` | Passed; 679,298 bytes in `dist/` |
| `npm run validate:browser` | 43 Chromium checks passed, zero failed |
| Pinned `taste@1` probe | 16/16 passed at 320, 390 and 1440 widths |
| axe WCAG A/AA discovery audit | Zero automated violations |
| Original tweet links | All 12 returned HTTP 200; embedded IDs and authors confirmed |

The interaction suite covers sorting, all topic filters, combined search, recovery from no results, save/unsave, persistence, cross-tab synchronization, malformed/unavailable storage, share/copy success and denial, dialog focus containment/return, keyboard navigation, reduced motion, and static resource loading. It checks 320, 390, 640, 900, 1100 and 1440 widths, plus 200% text enlargement. The final export also received a hands-on browser-tool walkthrough of search, saving, the saved view and sharing, with no console or resource errors.

To reproduce browser validation:

```sh
npx playwright install chromium webkit
npm run build
npm run validate:browser
```

The script creates its own temporary subpath server, closes it when done, and writes results/screenshots to `test/scratch/interaction/`. WebKit unavailability is reported as a limitation; use `npm run validate:browser -- --require-webkit` to require it. On Linux, WebKit also needs Playwright's documented system libraries.

The pinned design probe was run from the repository root:

```sh
node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste
```

That probe is an assignment input and is not redistributed. The delivered browser validation script remains independently runnable. See [the six-domain review and actual limitations](artifacts/validation.md), [recorded results](artifacts/check-results.json), [mobile screenshot](artifacts/mobile.webp), and [desktop screenshot](artifacts/desktop.webp).

**Limits:** WebKit could not launch because native libraries such as GTK4 and GStreamer are missing; Safari was not tested. Screen-reader sessions, physical devices, browser-native zoom, RTL/pseudo-localization and every possible image/viewport contrast pair were not tested. The 200% check enlarges text, not browser-native zoom. Automated checks are worker evidence, not independent certification. Clipboard success/failure paths were controlled in the browser tests; actual clipboard availability depends on browser permissions and a secure context.

## Content and maintenance

- `src/data/tweets.json` holds the snapshot timestamp, original IDs/URLs, exact text or short excerpts, observed counts, topics and local avatar paths. [Sources and selection limits](artifacts/sources.md) lists every post.
- Replace content only with verified posts and observed counts. Preserve IDs as strings, use UTC timestamps, set `isExcerpt` when showing a partial quote, and keep the original permalink. Do not present a summary as the author's words.
- Place new avatars in `public/avatars/`. Topic labels are defined in `src/types.ts` and `src/App.tsx`.
- Update the snapshot, rebuild, rerun validation, and include the refreshed `dist/`. The interface computes counts from the data. Tests deliberately assert this 12-post sample and should be updated if the sample changes.
- `public/art/ai-pepes.webp`, the favicon and share card are bundled locally. No external fonts, embeds, analytics or API requests are required to read the site.
- See [DESIGN.md](DESIGN.md) for the implemented tokens, components and responsive rules. Keep package-manager caches, dependency directories and scratch evidence out of submissions. No ignore file was added or changed.

## Attribution

The Pepe illustration and share-card composition were generated for this assignment; the frog mark and icons are original SVGs. Post text and avatars belong to their respective authors and are linked to their originals. DM Sans is bundled under the [SIL Open Font License](licenses/DM-Sans-OFL.txt).

Design guidance was adapted from [Jakub Krehel's Better Interface](https://github.com/jakubkrehel/skills/tree/267330e1adfc66a718fb65fa6918c1f06d0a689e/skills/better-interface), MIT. Documentation guidance was adapted from [Paul Bakaus's Impeccable](https://github.com/pbakaus/impeccable/blob/9d715cc4f5564a990ca8345abfdd5df6dc9b41c8/skill/reference/document.md), Apache-2.0. Their retained licenses and attribution are in [licenses/DESIGN-GUIDANCE.txt](licenses/DESIGN-GUIDANCE.txt).
