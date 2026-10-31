# 002 — Animate the Show overview expand/collapse

- **Status**: TODO
- **Commit**: c2f60193
- **Severity**: MEDIUM
- **Category**: Missed opportunity (state change that teleports) / Easing & tokens
- **Estimated scope**: 4 files, ~65 lines

## Problem

The Show page's overview has a `more` / `less` toggle. Pressing it swaps a truncated string for the
full one and the rest of the page — Details, Next episode, Seasons, Links — jumps by several hundred
pixels in a single frame, with no motion connecting the two states.

```text
<!-- src/app/pages/shows/pages/show/ui/show-header/show-header.component.html:60-88 — current -->
@if (tmdbShow()?.overview; as overview) {
  <div>
    @if (
      isSmall()
        ? overview.length < maxSmallOverviewLength
        : overview.length < maxLargeOverviewLength
    ) {
      <p class="mat-body-medium overview">{{ overview }}</p>
    }
    @if (
      isSmall()
        ? overview.length >= maxSmallOverviewLength
        : overview.length >= maxLargeOverviewLength
    ) {
      <p class="mat-body-medium overview">
        {{
          isMoreOverviewShown()
            ? overview
            : (isSmall()
                ? (overview | slice: 0 : maxSmallOverviewLength)
                : (overview | slice: 0 : maxLargeOverviewLength)) + '...'
        }}
      </p>
      <button matButton (click)="isMoreOverviewShown.set(!isMoreOverviewShown())">
        {{ isMoreOverviewShown() ? 'less' : 'more' }}
      </button>
    }
  </div>
}
```

```ts
// src/app/pages/shows/pages/show/ui/show-header/show-header.component.ts:60-62 — current
isMoreOverviewShown = signal(false);
maxSmallOverviewLength = 184;
maxLargeOverviewLength = 504;
```

```scss
/* src/app/pages/shows/pages/show/ui/show-header/show-header.component.scss:70-72 — current */
.overview {
  margin-bottom: 0.25rem;
}
```

The page has no motion tokens beyond `--transition-duration: 250ms` (`src/theme/theme-extensions.scss:15`)
and no `--ease-*` token at all, so this plan also adds the one curve it needs, beside the duration.

## Target

The paragraph lives in a clipped wrapper whose `height` is animated; the `more` / `less` button stays
outside that wrapper so it never moves with the text it controls.

```text
<!-- target: show-header.component.html, replacing lines 60-88 -->
@if (tmdbShow()?.overview; as overview) {
  <div>
    <div class="overview-wrapper" #overviewWrapper (transitionend)="onOverviewTransitionEnd($event)">
      <p class="mat-body-medium overview">
        @if (overviewIsLong() && !isMoreOverviewShown()) {
          {{ (overview | slice: 0 : overviewLimit()) + '...' }}
        } @else {
          {{ overview }}
        }
      </p>
    </div>
    @if (overviewIsLong()) {
      <button matButton (click)="toggleOverview()">
        {{ isMoreOverviewShown() ? 'less' : 'more' }}
      </button>
    }
  </div>
}
```

```scss
/* target: src/theme/theme-extensions.scss — add inside the existing `:root` block, directly
   after line 15 (`--transition-duration: 250ms;`) */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
```

```scss
/* target: src/app/pages/shows/pages/show/ui/show-header/show-header.component.scss */
.overview-wrapper {
  overflow: hidden;
  transition: height var(--transition-duration) var(--ease-out);
}
```

Exact motion values: **`height`, `250ms`, `cubic-bezier(0.23, 1, 0.32, 1)`** (the strong ease-out
from the motion rulebook: entering/exiting content uses ease-out; UI transitions stay under 300 ms).
`height` is a layout property, which is normally forbidden — an accordion is the accepted exception:
there is no transform that reveals real text without stretching it (`scaleY` distorts the glyphs), and
the clipped box must own the layout height so the sections below slide instead of jumping. Only the
wrapper's `height` animates; the text inside is clipped, not transformed.

TS additions, with these exact semantics:

```ts
// show-header.component.ts — add to the existing @angular/core import list: `inject`, `Injector`
private readonly injector = inject(Injector);

overviewWrapper = viewChild<ElementRef<HTMLElement>>('overviewWrapper');

overviewLimit = computed(() =>
  this.isSmall() ? this.maxSmallOverviewLength : this.maxLargeOverviewLength,
);

overviewIsLong = computed(
  () => (this.tmdbShow()?.overview?.length ?? 0) >= this.overviewLimit(),
);

toggleOverview(): void {
  const wrapper = this.overviewWrapper()?.nativeElement;
  const expanded = !this.isMoreOverviewShown();

  // No measurement, no inline height: the global reduced-motion rule zeroes every transition
  // duration, so no `transitionend` would fire and the box would stay pinned at a stale height.
  if (!wrapper || this.prefersReducedMotion()) {
    this.isMoreOverviewShown.set(expanded);
    return;
  }

  // Height of the state being left, read before the flag swaps the text underneath it.
  const from = wrapper.offsetHeight;
  this.isMoreOverviewShown.set(expanded);

  afterNextRender(
    () => {
      // `scrollHeight` reports the content height of the state just rendered, even while the box
      // is clipped — so the target needs no double render.
      const to = wrapper.scrollHeight;
      if (Math.abs(to - from) < 1) {
        wrapper.style.height = '';
        return;
      }

      wrapper.style.height = `${from}px`;
      // Commit the start height: writing `from` and `to` in the same style pass collapses into a
      // single change, and a transition needs two distinct computed values to run.
      wrapper.getBoundingClientRect();
      wrapper.style.height = `${to}px`;
    },
    { injector: this.injector },
  );
}

onOverviewTransitionEnd(event: TransitionEvent): void {
  if (event.propertyName !== 'height') return;
  if (event.target !== event.currentTarget) return;
  (event.currentTarget as HTMLElement).style.height = '';
}

private prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

Clearing the inline height at `transitionend` (and when `from` and `to` are equal) is what lets the
wrapper reflow naturally when the viewport or the text changes later; the height must never be left
pinned.

Collapse behaviour, stated so it is not mistaken for a bug: the truncated text renders immediately
and the box settles around it. The truncated text is a prefix of the full text, so the visible text
does not change while the box shrinks — only the empty space below it closes and the sections below
glide up. Expansion has no such gap: the full text renders immediately and is revealed by the growing
clip.

## Repo conventions to follow

- Motion tokens live in `src/theme/theme-extensions.scss` inside `:root`; `--transition-duration:
  250ms` is already there at line 15. Add `--ease-out` beside it — do not hand-type the curve into a
  component.
- Angular 22 idioms: `signal`, `computed`, `viewChild`, `afterNextRender` with an explicit injector,
  `inject()` — all already imported and used in this component
  (`viewChild` at line 58, `afterNextRender` at line 103).
- Native control flow only (`@if` / `@for`), template refs as `#name` read via `viewChild<ElementRef<HTMLElement>>`.
- Lint requires explicit return types on every method (`toggleOverview(): void`,
  `prefersReducedMotion(): boolean`).

## Steps

1. `src/theme/theme-extensions.scss` — inside the `:root` block, add
   `--ease-out: cubic-bezier(0.23, 1, 0.32, 1);` directly after `--transition-duration: 250ms;`
   (line 15). Leave every other token untouched.

2. `src/app/pages/shows/pages/show/ui/show-header/show-header.component.html` — replace lines 60-88
   with the target markup above. Keep `SlicePipe` in use; do not change the `@if (tmdbShow()?.overview; as overview)`
   guard. The button must end up a sibling _after_ `.overview-wrapper`, never inside it.

3. `src/app/pages/shows/pages/show/ui/show-header/show-header.component.scss` — add the
   `.overview-wrapper` rule above (keep the existing `.overview { margin-bottom: 0.25rem; }`: with
   `overflow: hidden` that margin becomes part of the wrapper's height, so the button stays exactly
   where it is today).

4. `src/app/pages/shows/pages/show/ui/show-header/show-header.component.ts` —
   - Add `inject` and `Injector` to the existing `@angular/core` import list.
   - Add the `injector`, `overviewWrapper`, `overviewLimit`, `overviewIsLong`, `toggleOverview`,
     `onOverviewTransitionEnd` and `prefersReducedMotion` members exactly as above. Keep
     `isMoreOverviewShown`, `maxSmallOverviewLength` and `maxLargeOverviewLength` as they are.

## Boundaries

- Do NOT change the truncation lengths (184 / 504) or the `'...'` suffix.
- Do NOT animate `max-height`, `scaleY`, `grid-template-rows`, or add `transition: all`. `height`
  only.
- Do NOT animate the `more` / `less` button, its label swap, or wrap it in the clipped container.
- Do NOT touch `t-show-details`, `t-show-seasons`, `t-show-links`, `t-show-next-episode` or the Show
  page itself — they only inherit the smoother layout change.
- Do NOT add a `@media (prefers-reduced-motion: reduce)` block to the component: the app already
  handles reduced motion globally (`src/app/shared/styles/manual/reminders.css:61-73`) and the JS
  branch above skips the measurement entirely.
- Do NOT add new dependencies.
- If the code you find does not match the excerpts above (drift since commit `c2f60193`), STOP and
  report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm lint:check` → clean (explicit return types, unused imports).
  - `pnpm format:check` → clean.
  - `pnpm test --include='src/app/pages/shows/pages/show/ui/show-header/show-header.component.spec.ts'`
    → passing. Its two overview tests click `page.getByText('more')` and assert
    `component.isMoreOverviewShown()` flips; the label text and signal name must stay unchanged.
  - `pnpm e2e` → full suite passing.
- **Feel check** (the Show page with a long overview, e.g. a show whose overview is over 504 chars,
  on a phone width and on desktop):
  - Press `more`: the text reveals downward in one continuous motion; the Details heading below
    glides down instead of teleporting. Nothing above the overview moves.
  - Press `less`: the box closes smoothly; the text above stays put and the sections below glide up
    (the truncated text appearing immediately is expected — see Target).
  - Press `more` then `less` quickly, mid-animation: the box must retarget from wherever it is, with
    no jump back to a stored height and no stuck inline height afterwards (inspect the element in
    DevTools — `style.height` must be empty once it settles).
  - In DevTools → Animations panel at 10% playback: the curve must start fast and settle (ease-out),
    not creep then accelerate. Duration must read 250 ms.
  - Resize the window after expanding, then collapse and expand again: the text reflows normally
    (proves the inline height was cleared).
  - DevTools → Rendering → `prefers-reduced-motion: reduce`: the toggle still works, the content
    appears/disappears instantly, and no inline `height` is written on `.overview-wrapper`.
- **Done when**: expanding and collapsing move the page smoothly over 250 ms with the ease-out curve,
  the button stays outside the clip, and the wrapper carries no inline height at rest.
