# Pond design system

## Overview

Pond is a compact reading room for the Identity.md community. The requested dark green and “Pepes armed with AI” direction appears as a forest-green interface, a single lime action color, and a detailed illustration of two Pepes equipped with AI hardware. Tweet text remains the product: the mobile entry screen includes the action, search, topic filters and the first post.

The source of truth is `src/styles.css`, with page composition in `src/App.tsx`. The system uses one font family, flat tonal surfaces, structural borders, and a two-column tweet grid beside a quieter context column. The hero is specific to the discovery view; the saved view opens directly on the feed.

## Colors

Colors use hex values. The primitive ramp and semantic aliases are defined in `src/styles.css:8`.

| Semantic token | Implemented value | Role |
| --- | --- | --- |
| `--color-page` | `#091710` | Page background |
| `--color-header` | `#0b1b13` | Header background |
| `--color-surface` | `#0e2017` | Tweets, fields, dialog |
| `--color-surface-raised` | `#122a1e` | Identity.md context panel |
| `--color-hover` | `#1a3425` | Hover and selected filter fill |
| `--color-border` | `#294334` | Separators and control boundaries |
| `--color-text` | `#edf2eb` | Primary text |
| `--color-text-secondary` | `#a9b9ac` | Supporting copy and source links |
| `--color-text-muted` | `#95a99a` | Dates, handles, secondary metrics |
| `--color-accent` | `#c3ed87` | Primary action, saved icon, headline signature |
| `--color-accent-hover` | `#d4f5a6` | Hover on the primary action |
| `--color-on-accent` | `#172510` | Text inside the lime action |
| `--color-focus` | `#d4f5a6` | Keyboard perimeter |
| `--color-warning` | `#e6caa2` | Storage and clipboard explanations |

The hero's art backdrop is `#10261b`. Its gradients use that same hue with transparent stops. At widths up to 624px the horizontal mask includes `#10261be6` at 20% and `#10261b80` at 75%, protecting enlarged text while retaining the illustration. The desktop art caption is `#d4dfc9`. Hovered card borders use `#425b46`; selected filters use `#5f7c51` and a visible dot.

Topic dots are supplemental: agents `#a7c9ae`, builders `#a2babc`, community `#c2b2cb`, memes `#d0c187`. Every dot is accompanied by its written topic; color alone never identifies a category. The backdrop for dialogs is `#020a06cc`.

The probe passed its resolved solid-background contrast checks. Sampled final mobile hero headline minima were 11.37:1 (cream) and 11.59:1 (lime); at 200% text they were 6.55:1 and 4.48:1, respectively. These are measured pixel samples at the recorded viewport, not a guarantee for every possible configuration. See `artifacts/validation.md` for method and limits.

## Typography

`DM Sans`, then Arial and sans-serif, is defined by the local variable WOFF2 in `public/dm-sans-latin-wght-normal.woff2`. The file is preloaded; `font-display: swap` preserves readable loading. The font supports variable weights; the interface uses **400, 500 and 700** only. Emoji retained in authors' names come from platform fallback fonts.

| Token | Default size | Use |
| --- | --- | --- |
| `--text-caption` | 13px / `.8125rem` | Topics, handles, dates, counts, metadata |
| `--text-small` | 14px / `.875rem` | Navigation, buttons, supporting copy |
| `--text-body` | 16px / `1rem` | Tweet body, inputs, dialog subheadings |
| `--text-section` | 20px / `1.25rem` | Brand and section headings |
| `--text-display-small` | 36px / `2.25rem` | Hero at 1056px and below |
| `--text-display` | 56px / `3.5rem` | Large discovery hero |

Five sizes are used in each measured normal viewport; six tokens define the full scale. Root size is `100%`, respecting browser font preferences. Inputs remain 16px at the normal mobile size. Body line height is 1.5, tweets 1.6, sidebar prose 1.7, headings 1.3 and the display headline 1.06. Tracking is natural except the headline (`-.05em`), brand (`-.03em`) and section titles (`-.025em`).

Headings balance wrapping. Prose uses pretty wrapping; tweet quotes preserve paragraph breaks. URLs, author names and text can wrap rather than disappear. No tweet body is line-clamped. An ellipsis only marks an intentional excerpt linked to its complete original. Numbers use tabular figures where counts change. Text remains selectable.

## Layout

The shared `.container` is at most 1280px wide, with 48px side margins by default, 20px below 752px, and 16px below 400px. Spacing commonly uses 4/8/12/16/20/24/28/32/40/48px; 18px card-grid gaps and 19px metric gaps are local density adjustments, not additional tokens.

The discovery header, hero and feed share the same alignment edges. Desktop content uses `minmax(0, 1fr) 280px` with a 32px gap; tweets use two equal columns with an 18px gap. Controls precede the content they change. Posts follow a stable DOM reading order. Header, feed heading, metrics and footer can wrap when text grows. The end-of-feed message spans the available width and wraps.

| Breakpoint | Actual behavior |
| --- | --- |
| 1200px / `75rem` | Hide brand context; sidebar becomes 250px; main gap 24px; hero footnote moves below action |
| 1056px / `66rem` | Sidebar moves below feed in three columns; headline becomes 36px |
| 752px / `47rem` | Hide external header link; header minimum 74px; sidebar becomes two columns; utility hit areas grow |
| 624px / `39rem` | Tweets become one column; hero minimum 250px; strengthen art mask; sidebar stacks; footer wraps |
| 400px / `25rem` | Margins become 16px; header About button and small navigation icons hide; secondary About controls remain in the feed/footer |

The card's view count is omitted in the denser two-column bands at 625–752px and 1057–1200px. The post's source remains available. No primary control is fixed or sticky over reading content. Text containers grow vertically. The art is cropped intentionally inside the hero; readable text is not clipped. Browser checks covered 320, 390, 640, 900, 1100 and 1440px and a 200% text enlargement at 390px; other widths are governed by these rules but were not exhaustively inspected.

## Elevation & Depth

Surfaces are flat. Tweets, fields and the context panel use a single 1px structural border, without box shadows. The hero's tonal art mask blends illustration and page. Only native modal top-layer behavior creates an overlay; body scrolling is locked while it is open. Avatars have a 1px white outline at 10% opacity to separate them from the dark surface.

## Shapes

- `--radius-small: 8px`: buttons, inputs, topic filters and icon hit areas.
- `--radius-card: 12px`: tweet cards, empty state and context panel.
- `--radius-large: 20px`: discovery hero and dialogs.
- Avatars are circular. Topic/status dots are circular and decorative.

## Components

| Component or pattern | Source | Behavior and states |
| --- | --- | --- |
| `TweetCard` | `src/components/TweetCard.tsx` | Receives tweet, displayed rank, saved state, save/share callbacks. Shows exact quote or marked excerpt, original profile/status links, date and captured metrics. Bookmark is pressed/unpressed with an accessible action name. |
| `Icon`, `FrogMark` | `src/components/Icon.tsx` | Original inline SVGs, `currentColor`, 1.6px icon stroke. Decorative SVGs are hidden from accessibility APIs; parent controls supply labels. |
| `Modal` | `src/components/Modal.tsx` | Native `dialog.showModal()`, inert background, Tab/Shift+Tab boundary cycle, Escape/backdrop/close action and trigger-focus restoration. Content scrolls within the viewport. |
| `.button-primary` | `src/styles.css` | Lime filled action, dark label, minimum 44px height. Background hover and `.96` press scale only when motion is allowed. |
| `.button-secondary` | `src/styles.css` | Neutral outlined action for external links in dialogs. |
| `.search-field` | `src/App.tsx`, `src/styles.css` | Named native search input; persistent accessibility label, example placeholder, clear action, high-contrast focus-within border. |
| `.filter-chip` | `src/App.tsx`, `src/styles.css` | Native buttons in a labeled group. `aria-pressed`, selected fill/border and dot; wraps onto multiple rows. |
| `.sort-control` | `src/App.tsx` | Labeled native select: most liked, most reposted, newest first. |
| `.empty-state` | `src/App.tsx` | Explains no matches or empty saved view, with clear-filter or discovery recovery action. |
| Saved state | `src/App.tsx` | Validated local IDs, storage-event tab synchronization, in-memory fallback with visible warning if storage fails. |
| Sharing | `src/App.tsx` | Original permalink, read-only selectable field, copy feedback and manual-copy recovery. |

Focus uses a 2px lime outline with a 4px offset. Forced-colors uses `Highlight`. Search uses the focus-within boundary. Save/result updates have polite status regions; the storage limitation uses an alert. The first keyboard target is “Skip to tweets.” Color/background/border transitions last 150ms under `prefers-reduced-motion: no-preference`; there are no automatic entrances, endless animations or autoplay.

## Do's and Don'ts

- Start a related view with `.container`, the existing feed controls and `TweetCard`; keep the action before the results.
- Use semantic color aliases in components and the existing type sizes. Use one lime filled action for the current task.
- Keep provenance next to the feed and the original link on each quote. Compute any displayed counts from real data.
- Keep long names, tweet text, empty-state messages and enlarged text able to wrap. Preserve the dialog's focus loop and return behavior.
- Add a new page as a hash view using existing tokens/components; do not introduce server-dependent routes into this static export.
- Avoid additional font families, tracking on small labels, live-looking fabricated numbers, remote font/image dependencies, or embedded social widgets that make the snapshot unusable offline.

Guidance attribution and licenses: `licenses/DESIGN-GUIDANCE.txt`. Validation and known unperformed checks: `artifacts/validation.md`.
