# 006 — Route the remaining motion through the timing tokens

- **Status**: TODO
- **Commit**: 165b5c25
- **Severity**: LOW
- **Category**: Cohesion & tokens / Performance
- **Estimated scope**: 6 files, ~20 lines

## Problem

The app has two motion tokens in `:root`
(`src/theme/theme-extensions.scss:15-16`):

```scss
--transition-duration: 250ms;
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
```

Only one rule uses them — the accordion at
`src/app/pages/shows/pages/show/ui/show-header/show-header.component.scss:79`. Every other transition
in the app hand-types its own duration and easing, and two of them are at or over the 300 ms UI
budget with the browser's weak default `ease`:

```scss
/* src/app/shared/components/shows/shows.component.scss:6-8 — current */
.show-wrapper.move {
  transition: transform 300ms;
}
```

```scss
/* src/theme/sidenav.scss:81-88 — current */
.icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 1.75rem;
  border-radius: 100000rem;
  transition: background 300ms;
}
```

```scss
/* src/app/shared/components/episode-still/episode-still.component.scss:21-23 — current */
.still-thumbnail {
  aspect-ratio: 16 / 9;
  transition: opacity 0.1s ease-in-out;
  width: 100%;
}
```

The same `opacity 0.1s ease-in-out` fade is repeated at
`src/app/shared/components/shows/show-list-item/show-list-item.component.scss:25` (`.poster-image`)
and `src/app/pages/shows/pages/show/ui/show-header/show-header.component.scss:19`
(`.poster-thumbnail`).

What that costs:

- **The list reorder (`shows.component.scss:7`)** is a FLIP: `TransitionGroupDirective` measures the
  rows, translates them to their old positions and transitions the translate back to zero
  (`src/app/shared/directives/transition-group.directive.ts:55-60,86-101,109-119`). It runs at
  exactly 300 ms on the UA `ease` — the slowest thing in the app, on the motion a user sees when
  filtering or adding a show, and not on a token.
- **The nav pill (`sidenav.scss:88`)** fades the active bottom-tab background over 300 ms on the UA
  `ease`, on every navigation, while the page itself morphs in ~250 ms. The two should read as one
  event. It also animates the `background` shorthand rather than `background-color`.
- **The image fades** start slow (`ease-in-out`) and run at 100 ms, under the 125–200 ms band for
  something appearing. An image loading into a row is an entrance; entrances want `ease-out`.
- **The FLIP's forced reflow reads the whole document**:
  ```ts
  // src/app/shared/directives/transition-group.directive.ts:55-60 — current
  const animate = (): void => {
    items.forEach(this.applyTranslation);
    // @ts-expect-error
    this._forceReflow = document.body.offsetHeight; // force reflow to put everything in position
    this.items()?.forEach(this.runTransition.bind(this));
  };
  ```
  The `@ts-expect-error` suppresses a property that does not exist on the class, and `document.body`
  makes the read look document-wide. The flush only needs to cover the list.

## Target

One duration scale and one curve per kind of motion, taken from the tokens:

| Motion                  | Property           | Duration                              | Easing                                    |
| ----------------------- | ------------------ | ------------------------------------- | ----------------------------------------- |
| List reorder (FLIP)     | `transform`        | `var(--transition-duration)` (250 ms) | `var(--ease-in-out)` — on-screen movement |
| Nav active pill         | `background-color` | `var(--transition-duration)` (250 ms) | `ease` — a colour change                  |
| Image / poster entrance | `opacity`          | `150ms`                               | `var(--ease-out)` — entering              |

```scss
/* target: src/theme/theme-extensions.scss — add inside `:root`, directly after line 16
   (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1);`) */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
```

```scss
/* target: src/app/shared/components/shows/shows.component.scss:6-8 */
.shows .show-wrapper.move {
  transition: transform var(--transition-duration) var(--ease-in-out);
}
```

```scss
/* target: src/theme/sidenav.scss:88 */
transition: background-color var(--transition-duration) ease;
```

```scss
/* target: src/app/shared/components/episode-still/episode-still.component.scss:23,
   src/app/shared/components/shows/show-list-item/show-list-item.component.scss:25,
   src/app/pages/shows/pages/show/ui/show-header/show-header.component.scss:19 */
transition: opacity 150ms var(--ease-out);
```

```ts
// target: src/app/shared/directives/transition-group.directive.ts:55-60
const animate = (): void => {
  items.forEach(this.applyTranslation);
  // Commit the translated positions before the transition is applied, so the first frame starts
  // from the old position. Read the list's own first item rather than the body: this is the one
  // write-then-read of the FLIP and it should cost the list.
  items[0]?.element.getBoundingClientRect();
  this.items()?.forEach(this.runTransition.bind(this));
};
```

Exact motion values: **`--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`** for on-screen movement,
**`ease`** for colour, **`cubic-bezier(0.23, 1, 0.32, 1)`** (`--ease-out`) for entrances, all inside
the 250 ms / 150 ms budgets. `--transition-duration` (250 ms) is already the app's standard and the
page view transition lands at roughly the same length, so the pill and the reorder join it.

Why `250ms` for the FLIP and not 300: 300 ms is the ceiling and the UA `ease` is the weak default;
250 ms on a strong ease-in-out settles faster and matches the accordion the app already ships. Why
not `ease-out` for the FLIP: the rows are moving across the screen, not entering — `ease-in-out` is
the curve for movement and avoids the "snap then crawl" ending an ease-out gives a reorder.

## Repo conventions to follow

- Tokens live in `src/theme/theme-extensions.scss` inside `:root`, one per line, in the block at
  lines 11-16. Add `--ease-in-out` beside `--ease-out`; do not add a second duration scale.
- Every consumer must reference the token, not a literal. Exemplar:
  `show-header.component.scss:77-80` —
  ```scss
  .overview-wrapper {
    overflow: hidden;
    transition: height var(--transition-duration) var(--ease-out);
  }
  ```
- The sidenav file follows an existing pattern of using `100000rem` for pill radii
  (`sidenav.scss:27-28`); `background-color` must be named so the effect-layer and elevation paints
  are not swept into the transition.
- The FLIP directive keeps its logic in small local functions; `animate` is already declared
  `(): void`, which satisfies the repo's explicit-return-type lint. Keep that shape.
- Delete `this._forceReflow` and its `@ts-expect-error`: no other code reads it (verify with a
  project-wide search before deleting).

## Steps

1. `src/theme/theme-extensions.scss` — add `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);` as a new
   line directly after `--ease-out` (line 16). Leave every other token untouched.
2. `src/app/shared/components/shows/shows.component.scss` — change line 7 to
   `transition: transform var(--transition-duration) var(--ease-in-out);` (keep the `.show-wrapper.move`
   selector and the `.shows` nesting exactly as they are).
3. `src/theme/sidenav.scss` — change line 88 to
   `transition: background-color var(--transition-duration) ease;`. Nothing else in that rule moves.
4. `src/app/shared/components/episode-still/episode-still.component.scss:23`,
   `src/app/shared/components/shows/show-list-item/show-list-item.component.scss:25` and
   `src/app/pages/shows/pages/show/ui/show-header/show-header.component.scss:19` — change each
   `transition: opacity 0.1s ease-in-out;` to `transition: opacity 150ms var(--ease-out);`.
   The `.not-loaded { opacity: 0 }` rules stay as they are.
5. `src/app/shared/directives/transition-group.directive.ts` — replace the body of `animate` with the
   target above, then search the project for `_forceReflow` and remove any declaration if one exists.

## Boundaries

- Do NOT change the `show-header.component.scss:79` accordion — it already uses both tokens.
- Do NOT change the redirect entry (`redirect.component.scss`) or the ticker; they are planned
  separately.
- Do NOT add `will-change` anywhere. The transforms are short-lived and Chromium already promotes
  them; a layer per row for a list of 20+ is worse than the transition.
- Do NOT touch the `transitionend` wiring in the directive (`:86-101`), the scroll listener
  (`:31-35`) or the position bookkeeping (`:41-78`). Only the forced-reflow line and the two timing
  declarations change.
- Do NOT change any element's resting appearance, colours, or the `background: none` / `rgba(...)`
  values in `sidenav.scss` — only the transition declaration.
- Do NOT add new dependencies or new tokens beyond `--ease-in-out`.
- If the code you find does not match the excerpts above (drift since commit `165b5c25`), STOP and
  report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm lint:check` → clean.
  - `pnpm format:check` → clean.
  - `pnpm test --include='src/app/shared/directives/transition-group.directive.spec.ts'` → passing.
  - `pnpm e2e` → full suite passing.
- **Feel check**:
  - Shows page, filter the list or add a show so rows reorder: the rows glide over 250 ms and settle
    without a slow tail; nothing jitters at the start.
  - Reorder a list while scrolling: rows must not jump by the scroll offset (the directive's scroll
    bookkeeping is still doing its job).
  - Navigate between pages: the bottom-tab active pill and the page transition finish together, and
    the pill does not appear to lag a quarter second behind the new page.
  - Load a Show page and the History page on a cold cache: posters fade in over 150 ms with a fast
    start; they must not look like they "blink" in slowly.
  - In DevTools → Performance, record a reorder: one Layout at the start of the FLIP, composite-only
    frames during the 250 ms.
- **Done when**: every transition this plan touches is on the shared tokens (reorder 250 ms on
  `--ease-in-out`, nav pill 250 ms `ease`, posters 150 ms on `--ease-out`), and `.show-wrapper.move`
  no longer reads a body offset to force its reflow.
