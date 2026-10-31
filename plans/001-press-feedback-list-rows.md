# 001 — Add press feedback to the two primary list rows

- **Status**: DONE
- **Commit**: c2f60193
- **Severity**: MEDIUM
- **Category**: Physicality & origin (press feedback) / Missed opportunity
- **Estimated scope**: 5 files, ~30 lines

## Problem

The app has two lists the user taps more than anything else: the Show rows on
`/shows`, `/shows/progress`, `/shows/upcoming`, `/shows/watchlist`, `/lists` and the search page
(all rendered by `t-show-list-item-wrapper`), and the History rows on `/shows/history`. Both rows
are bare `<a>` elements wrapping a `<mat-list-item>` with no press state at all: the first
acknowledgement of the tap is the router's view transition, which only starts once navigation is
already underway. On a slow navigation (or a cold History fetch) the row sits there doing nothing.

The app already solved this once. The Season row wraps the same kind of anchor and gets Material's
ripple plus the repo's scroll-hiding wrapper (template fences below are `text` on purpose: the
Angular template must be quoted verbatim, not HTML-formatted):

```text
<!-- src/app/pages/shows/pages/season/ui/season-episodes/season-episodes.component.html:4-12 -->
<a
  matRipple
  tHideRippleOnScroll
  [routerLink]="
    '/shows/s/' + showSlug() + '/season/' + seasonNumber() + '/episode/' + (i + 1)
  "
  [state]="{ back }"
  class="episode-link"
>
```

```scss
/* src/app/pages/shows/pages/season/ui/season-episodes/season-episodes.component.scss:1-3 */
.episode-link {
  display: block;
}
```

`mat-list-item` does not bring a ripple of its own (its module imports `MatRippleModule` for list
options only; the list item template has no `matRipple`), so the two rows below have none:

```text
<!-- src/app/shared/components/shows/show-list-item-wrapper/show-list-item-wrapper.component.html:2-6 — current -->
<a
  [routerLink]="withLinkToEpisode() && showInfo.nextEpisode ? episodeLink() : showLink()"
  [info]="showInfo"
  [state]="{ back: back(), showInfo: showInfo }"
>
```

```text
<!-- src/app/pages/shows/pages/history/history.component.html:11-22 — current -->
<a
  class="episode-link"
  [routerLink]="episodeLink(play)"
  [state]="{
    back: router.url,
    episodeInfo: {
      show: play.show,
      tmdbEpisode: tmdbEpisodeFor(play),
    },
  }"
  (click)="prepareViewTransition(row)"
>
```

Press feedback is the one gesture that fires tens of times a day and currently has no answer at
all. This plan does not invent a new interaction: it applies the pattern the repo already ships,
with Material's own ripple timings (enter 225 ms / exit 150 ms, animating `transform` and `opacity`
only).

## Target

Both anchors carry `matRipple` + `tHideRippleOnScroll` on the anchor element itself (the element
that is the full row, so the ripple covers the row), and both are block boxes so the ripple's
`position: relative; overflow: hidden` box matches the row.

```text
<!-- target: show-list-item-wrapper.component.html -->
@if (showInfo(); as showInfo) {
  <a
    matRipple
    tHideRippleOnScroll
    class="show-link"
    [routerLink]="withLinkToEpisode() && showInfo.nextEpisode ? episodeLink() : showLink()"
    [info]="showInfo"
    [state]="{ back: back(), showInfo: showInfo }"
  >
```

```text
<!-- target: history.component.html -->
<a
  matRipple
  tHideRippleOnScroll
  class="episode-link"
  [routerLink]="episodeLink(play)"
  [state]="{
    back: router.url,
    episodeInfo: {
      show: play.show,
      tmdbEpisode: tmdbEpisodeFor(play),
    },
  }"
  (click)="prepareViewTransition(row)"
>
```

```scss
/* target: show-list-item-wrapper.component.scss */
:host {
  display: block;
}

.show-link {
  display: block;
}
```

`history.component.scss` already has `.episode-link { display: block; }` at lines 13-16 — do not
add it twice.

No colour, duration or curve is invented here. Material's ripple defaults apply:
`--mat-ripple-color: color-mix(in srgb, var(--mat-sys-on-surface) 10%, transparent)`,
`enterDuration: 225`, `exitDuration: 150`. `tHideRippleOnScroll` sets `MatRipple.disabled = true`
and launches one persistent ripple itself on a stationary pointerdown, fading it on scroll.

## Repo conventions to follow

- Directive and module import order matches the Season exemplar exactly:
  `MatRippleModule` from `@angular/material/core`, `HideRippleOnScrollDirective` from
  `@shared/directives/hide-ripple-on-scroll.directive` —
  `src/app/pages/shows/pages/season/ui/season-episodes/season-episodes.component.ts:4-5,12-18`.
- The link class is named after the row (`.episode-link`, `.season-link`); follow with `.show-link`.
- Component SCSS files are beside the component; no global styles are involved.

## Steps

1. `src/app/shared/components/shows/show-list-item-wrapper/show-list-item-wrapper.component.ts`
   - Add `import { HideRippleOnScrollDirective } from '@shared/directives/hide-ripple-on-scroll.directive';`
     after the `RouterLink` import (line 5).
   - Change line 13 from
     `imports: [MatListModule, MatRippleModule, ShowListItemComponent, RouterLink],`
     to
     `imports: [MatListModule, MatRippleModule, HideRippleOnScrollDirective, ShowListItemComponent, RouterLink],`.
     `MatRippleModule` is already there; do not remove it.

2. `src/app/shared/components/shows/show-list-item-wrapper/show-list-item-wrapper.component.html`
   - On the anchor at line 2, add `matRipple`, `tHideRippleOnScroll` and `class="show-link"`, in
     that order, before the existing `[routerLink]` binding — resulting markup exactly as in
     Target above.

3. `src/app/shared/components/shows/show-list-item-wrapper/show-list-item-wrapper.component.scss`
   - Append `.show-link { display: block; }` after the existing `:host` block. Keep the `:host`
     rule as it is.

4. `src/app/pages/shows/pages/history/history.component.ts`
   - Add `import { MatRippleModule } from '@angular/material/core';` next to the
     `MatListModule` import (line 12).
   - Add `import { HideRippleOnScrollDirective } from '@shared/directives/hide-ripple-on-scroll.directive';`
     after it.
   - Change line 30 from
     `imports: [MatListModule, RouterLink, SpinnerComponent, ErrorText, HistoryItemComponent],`
     to
     `imports: [MatListModule, MatRippleModule, HideRippleOnScrollDirective, RouterLink, SpinnerComponent, ErrorText, HistoryItemComponent],`.

5. `src/app/pages/shows/pages/history/history.component.html`
   - On the anchor at line 11, add `matRipple` and `tHideRippleOnScroll` before the existing
     `class="episode-link"` — resulting markup exactly as in Target above. Do not touch
     `history.component.scss`; `.episode-link` is already `display: block`.

## Boundaries

- Do NOT touch the Season/Episode rows (`season-episodes.component.*`) — they are the exemplar and
  are already correct.
- Do NOT add `matRipple` to `mat-list-item`, `mat-nav-list`, the sidenav links, the header buttons or
  any list that already has feedback. This plan is exactly the two anchors above.
- Do NOT add `:active { transform: scale(...) }`, a `:hover` background, or any new CSS transition.
  The ripple is the press feedback; adding a scale on top of it double-answers the same event.
- Do NOT add `stopPropagation` to the row's inner buttons (favorite, list menu): the ripple is on the
  anchor, so tapping those buttons ripples the row as well. The Season rows already behave this way
  with their checkboxes; matching them is the point.
- Do NOT add new dependencies.
- If the code you find does not match the excerpts above (drift since commit `c2f60193`), STOP and
  report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm lint:check` → clean (explicit return types, import order, selector prefix all unchanged by
    this plan).
  - `pnpm format:check` → clean.
  - `pnpm test --include='src/app/shared/components/shows/show-list-item-wrapper/show-list-item-wrapper.component.spec.ts'`
    and `pnpm test --include='src/app/pages/shows/pages/history/history.component.spec.ts'` → all
    passing. That spec queries `fixture.nativeElement.querySelector('a')` and asserts the `href`;
    the ripple must not wrap the anchor in another element.
  - `pnpm e2e` → full suite passing (History and Show specs navigate by clicking these rows).
- **Feel check** (real phone, or DevTools device emulation with touch):
  - Tap and hold a Show row on `/shows`: the ripple starts under the finger on pointerdown and is
    still visible when the finger lifts; it must cover the whole row edge to edge, not a thin strip
    (a thin strip means `display: block` did not land).
  - Press, hold, then start scrolling the list without lifting: the ripple fades out and no
    navigation happens.
  - Tap a History row: same behaviour, and the row still navigates with its view transition.
  - Tap the favourite star inside a Show row: the row ripples and the show does not navigate — the
    same as tapping a checkbox inside a Season row today.
  - In DevTools → Rendering → `prefers-reduced-motion: reduce`: the row must not become inert.
    The global rule in `src/app/shared/styles/manual/reminders.css:61-73` forces
    `transition-duration: 0s !important`, so Material's ripple appears without animating (or is
    suppressed by Material itself) — either is acceptable; navigation must still work, and no
    element may be left mid-transition or invisible.
- **Done when**: both rows ripple on pointerdown, the ripple is clipped to the row's bounds, and no
  existing spec or e2e test changed behaviour.
