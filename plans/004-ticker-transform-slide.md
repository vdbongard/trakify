# 004 — Slide the ticker text with a transform

- **Status**: TODO
- **Commit**: 165b5c25
- **Severity**: HIGH
- **Category**: Performance / Easing & duration / Accessibility
- **Estimated scope**: 2 files, ~50 lines

## Problem

`TickerComponent` truncates a single line with `text-overflow: ellipsis` and, on hover, slides the
text left to reveal the rest. The slide is done with `left`, over a duration that grows with the
width of the text, on a curve with a `y > 1` overshoot:

```scss
/* src/app/shared/components/ticker/ticker.component.scss:1-23 — current */
:host.ticker {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  // Slide the text inside the (stationary) host box instead of moving the box itself: a box
  // that moves paints over the siblings that follow it, such as the breadcrumb divider.
  .ticker-text {
    position: relative;
    left: 0;
    transition: left calc(0.5s + var(--animated-text-width) / 80 * 1s)
      cubic-bezier(0.24, 0.41, 0.69, 1.07);
  }

  &:hover {
    cursor: default;
    text-overflow: clip;

    .ticker-text {
      left: calc(-1px * var(--animated-text-width));
    }
  }
}
```

```ts
// src/app/shared/components/ticker/ticker.component.ts:1-59 — current
import { Component, ElementRef, inject, input, signal } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[ticker]',
  standalone: true,
  templateUrl: './ticker.component.html',
  styleUrl: './ticker.component.scss',
  host: {
    '[class.ticker]': 'tickerIf()',
    '[style.--animated-text-width]': 'animatedTextWidth()',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
  },
})
export class TickerComponent {
  element = inject(ElementRef);

  tickerIf = input(true);

  animatedTextWidth = signal(0);
  visibleEllipsisTimeoutId = signal<number | undefined>(undefined);

  onMouseEnter(): void {
    this.calculateAnimatedTextWidth();
    // The ellipsis would sit on top of the text while it slides, so drop it until the text
    // has slid back into place.
    this.element.nativeElement.style.setProperty('text-overflow', 'clip');

    if (this.visibleEllipsisTimeoutId() !== undefined) {
      window.clearTimeout(this.visibleEllipsisTimeoutId());
    }
  }

  onMouseLeave(): void {
    const host = this.element.nativeElement as HTMLElement;
    // The slide lives on the inner text element, so that is where the duration is defined.
    const text = host.querySelector<HTMLElement>('.ticker-text') ?? host;
    const transitionDuration = parseFloat(getComputedStyle(text).transitionDuration) || 0;

    const timeoutId = window.setTimeout(() => {
      host.style.removeProperty('text-overflow');
    }, transitionDuration * 1000);
    this.visibleEllipsisTimeoutId.set(timeoutId);
  }

  calculateAnimatedTextWidth(): void {
    const label = this.element.nativeElement;
    const hasOverflow = label.scrollWidth > label.clientWidth;

    if (!hasOverflow) {
      this.animatedTextWidth.set(0);
      return;
    }

    const offset = 1; // Needed for end of text to be visible on hover
    this.animatedTextWidth.set(label.scrollWidth - label.clientWidth + offset);
  }
}
```

Three things are wrong, in order of how much they are felt:

1. **The duration.** `0.5s + width / 80 * 1s` is unbounded: a title with 200px of hidden text slides
   for 3 seconds. The ticker sits on every show row title, every history row, the breadcrumb and the
   cast list — a hover on a list row is a tens-of-times-a-day action, and it answers with a
   two-to-three second scroll.
2. **The curve.** `cubic-bezier(0.24, 0.41, 0.69, 1.07)` overshoots by 7%: the text slides past its
   end and settles back. On a text reveal that reads as a wobble, not as polish.
3. **The property.** `left` is a layout property — every frame relayouts the line. The paint concern
   in the comment ("a box that moves paints over the siblings that follow it") only applies to
   moving the host box; the inner `.ticker-text` is already clipped by the host's `overflow: hidden`,
   so translating the text itself is clipped exactly the same way.

There is also no hover gating: `&:hover` fires a false hover on touch, and under
`prefers-reduced-motion` the app's global rule
(`src/app/shared/styles/manual/reminders.css:61-73`) forces the transition to `0s`, which makes the
text **teleport** to its end position instead of not moving.

## Target

`transform` on the inner text, over the shared 250 ms duration and the shared strong ease-out, with
the text made block-level for the length of the slide (a transform does nothing to an inline box).
Hover gating and the reduced-motion branch live in TS, because both decide whether any of the state
changes happen at all — not just how long the transition takes.

```scss
/* target: src/app/shared/components/ticker/ticker.component.scss — full file */
:host.ticker {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  // The slide is a transform, not `left`: `left` relayouts the line on every frame. A transform
  // does nothing to an inline box, so the component makes the text block-level for the length of
  // the slide (see `.sliding` below) and gives it `overflow: visible` — a clipped inline-block
  // takes its baseline from its bottom edge and would push the text up by half a line.
  .ticker-text {
    transition: transform var(--transition-duration) var(--ease-out);
  }
}

:host.ticker:hover {
  cursor: default;
}

// Set by the component on mouse enter and cleared once the slide back has finished, so the text
// stays block-level for both directions of the slide.
:host(.ticker.sliding) .ticker-text {
  display: inline-block;
}

// Touch reports a false hover on tap, which would start a slide with no pointer to end it.
@media (hover: hover) and (pointer: fine) {
  :host(.ticker.hovered) .ticker-text {
    transform: translateX(calc(-1px * var(--animated-text-width)));
  }
}
```

```ts
// target: src/app/shared/components/ticker/ticker.component.ts — full file
import { Component, ElementRef, inject, input, OnDestroy, signal } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[ticker]',
  standalone: true,
  templateUrl: './ticker.component.html',
  styleUrl: './ticker.component.scss',
  host: {
    '[class.ticker]': 'tickerIf()',
    '[class.sliding]': 'sliding()',
    '[class.hovered]': 'hovered()',
    '[style.--animated-text-width]': 'animatedTextWidth()',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
  },
})
export class TickerComponent implements OnDestroy {
  element = inject(ElementRef);

  tickerIf = input(true);

  animatedTextWidth = signal(0);
  visibleEllipsisTimeoutId = signal<number | undefined>(undefined);

  /** True from the first frame of the slide until the slide back has finished. */
  sliding = signal(false);
  /** True while the pointer is on the element; drives the transform. */
  hovered = signal(false);

  private frameId = 0;

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameId);
    const timeoutId = this.visibleEllipsisTimeoutId();
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }

  onMouseEnter(): void {
    this.calculateAnimatedTextWidth();

    // A false hover on touch gets no slide, and with reduced motion the text would jump straight
    // to its end position (the global rule zeroes the duration) instead of sliding — so neither
    // gets one. The ellipsis is left alone in both cases.
    if (!this.slidesOnHover()) return;

    // The ellipsis would sit on top of the text while it slides, so drop it until the text
    // has slid back into place.
    this.element.nativeElement.style.setProperty('text-overflow', 'clip');

    if (this.visibleEllipsisTimeoutId() !== undefined) {
      window.clearTimeout(this.visibleEllipsisTimeoutId());
      this.visibleEllipsisTimeoutId.set(undefined);
    }

    // Two frames: the first makes the text block-level, the second starts the transform. A
    // transform set in the same style pass as the `display` change does not reliably animate.
    this.sliding.set(true);
    cancelAnimationFrame(this.frameId);
    this.frameId = requestAnimationFrame(() => this.hovered.set(true));
  }

  onMouseLeave(): void {
    const host = this.element.nativeElement as HTMLElement;
    // The slide lives on the inner text element, so that is where the duration is defined.
    const text = host.querySelector<HTMLElement>('.ticker-text') ?? host;
    const transitionDuration = parseFloat(getComputedStyle(text).transitionDuration) || 0;

    cancelAnimationFrame(this.frameId);
    this.hovered.set(false);

    // Keep the ellipsis off, and the text block-level, until the slide back has finished.
    const timeoutId = window.setTimeout(() => {
      host.style.removeProperty('text-overflow');
      this.sliding.set(false);
    }, transitionDuration * 1000);
    this.visibleEllipsisTimeoutId.set(timeoutId);
  }

  calculateAnimatedTextWidth(): void {
    const label = this.element.nativeElement;
    const hasOverflow = label.scrollWidth > label.clientWidth;

    if (!hasOverflow) {
      this.animatedTextWidth.set(0);
      return;
    }

    const offset = 1; // Needed for end of text to be visible on hover
    this.animatedTextWidth.set(label.scrollWidth - label.clientWidth + offset);
  }

  private slidesOnHover(): boolean {
    return (
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }
}
```

Exact motion values: **`transform`, `250ms`, `cubic-bezier(0.23, 1, 0.32, 1)`** — the shared
`--transition-duration` and `--ease-out`. 250 ms is the app's standard UI duration (under the 300 ms
budget) and the strong ease-out starts fast, which is what a reveal wants. The slide distance is
unchanged: it still travels exactly the hidden width (`--animated-text-width`), so the last character
lands at the right edge.

Why two frames: `display: inline` → `inline-block` and the transform landing in the same style pass
is not a reliable way to start a transition. Setting `sliding` first and `hovered` on the next frame
guarantees two distinct computed values for `transform` (`none`, then `translateX(-N)`). On leave the
reverse needs no extra frame: the box already exists.

## Repo conventions to follow

- Motion tokens live in `src/theme/theme-extensions.scss` inside `:root`:
  `--transition-duration: 250ms` (line 15) and `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` (line 16).
  Use them; do not type a curve or a duration into the component.
- Use `--transition-duration` for both directions — the same 250 ms the accordion uses
  (`src/app/pages/shows/pages/show/ui/show-header/show-header.component.scss:79`).
- Host bindings as signals are already the component's pattern (`ticker.component.ts:9-14`);
  `[class.sliding]` / `[class.hovered]` extend it. Keep `[(mouseenter)]` / `[(mouseleave)]`.
- `inject(ElementRef)` delegate style (`this.element.nativeElement`) is used throughout the
  component — keep it.
- Explicit return types on every method (`ngOnDestroy(): void`, `slidesOnHover(): boolean`).
- Reduced motion is normally handled by the global rule, but that rule only zeroes durations; motion
  whose _value_ changes anyway (a transform that still gets applied) has to be branched in TS first.
  Plan 002 (`show-header.component.ts`) is the precedent for branching on
  `matchMedia('(prefers-reduced-motion: reduce)')` in a component.
- The unit-test browser reports `hover: hover`, `pointer: fine` and `reduce: false` (verified against
  the Playwright Chromium build this repo tests in), so the existing spec keeps passing.

## Steps

1. Replace `src/app/shared/components/ticker/ticker.component.scss` with the target file above.
   Keep the comment about sliding inside the host box — it is the reason the text is translated
   rather than the host.
2. Replace `src/app/shared/components/ticker/ticker.component.ts` with the target file above.
   The `OnDestroy` implementation and the `slidesOnHover()` gate are new; everything else is a
   re-ordering of the existing members.
3. Do not change `src/app/shared/components/ticker/ticker.component.html`
   (`<span class="ticker-text"><ng-content /></span>`); the `.ticker-text` element and class name are
   what the CSS and the leave handler target.
4. Do not change `src/app/shared/components/ticker/ticker.component.spec.ts`. Its three width/ellipsis
   tests must pass unchanged: the width is still measured on the host before anything else happens,
   and the ellipsis is still set on enter and restored after the computed duration on leave.

## Boundaries

- Do NOT touch the four call sites (`breadcrumb.component.html:3`,
  `history-item.component.html:18-19`, `show-cast.component.html:22-23`,
  `show-list-item-content.component.html:1,24,53,57,69`). They only need the component to behave.
- Do NOT change the truncation/ellipsis mechanism. The text stays inline at rest and the ellipsis
  stays the host's; that is why the block-level switch is scoped to `.sliding`.
- Do NOT remove the empty-line measurement or the `+ 1` offset — the last character must reach the
  right edge.
- Do NOT add `will-change`, a JS tween, or a scroll-based slide.
- Do NOT keep a `left` value alongside the transform "for safety".
- Do NOT add a per-component `@media (prefers-reduced-motion: reduce)` block: the global rule plus
  `slidesOnHover()` already cover it.
- If the code you find does not match the excerpts above (drift since commit `165b5c25`), STOP and
  report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm lint:check` → clean.
  - `pnpm format:check` → clean.
  - `pnpm test --include='src/app/shared/components/ticker/ticker.component.spec.ts'` → all 7 tests
    pass, unmodified.
  - `pnpm e2e` → full suite passing.
- **Feel check** (a show row with a long title, e.g. the Shows page with a narrow window so the title
  truncates; also the breadcrumb on the Show page):
  - Hover: the text slides left once, fast at the start and settling at the end, and lands with the
    final character at the right edge. It must not wobble or overshoot.
  - Move the pointer off: the text slides back over the same 250 ms; the ellipsis only returns after
    the text has stopped (no "…" riding over the moving text).
  - Hover in and out quickly, mid-slide: the text must reverse from where it is, with no jump.
  - Nothing on the row moves vertically — the line, the poster and the next row must stay put (this
    is the baseline trap the `overflow: visible` note is about).
  - In DevTools → Performance, record a hover on a long row: the slide must show only composite
    frames, with no Layout bars repeating per frame.
  - DevTools → Animations panel at 10% playback: the curve starts fast and settles; duration reads
    250 ms.
  - DevTools → Rendering → `prefers-reduced-motion: reduce`: hovering does nothing at all — no
    slide, no jump to the end, and the ellipsis stays.
  - DevTools device toolbar → touch emulation: tapping a row must not start a slide or remove the
    ellipsis.
- **Done when**: the slide is a single 250 ms ease-out transform in both directions, the ellipsis
  returns only after it finishes, no layout work happens per frame, and neither touch nor reduced
  motion starts it.
