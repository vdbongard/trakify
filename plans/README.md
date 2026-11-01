# Animation plans

Plans from two animation sweeps. The first three (commit stamp `c2f60193`) are implemented; 004-006
came out of the full motion review at `165b5c25` and are still open. Each plan is self-contained:
exact file paths, current code, target values, steps, boundaries and a feel check. They are written
for an executor with no context from the audit.

| #   | Plan                                                                                | Severity | Status |
| --- | ----------------------------------------------------------------------------------- | -------- | ------ |
| 001 | [Press feedback on the two primary list rows](./001-press-feedback-list-rows.md)    | MEDIUM   | DONE   |
| 002 | [Animate the Show overview expand/collapse](./002-overview-expand-collapse.md)      | MEDIUM   | DONE   |
| 003 | [Acknowledge the OAuth return with a spinner](./003-redirect-login-feedback.md)     | LOW      | DONE   |
| 004 | [Slide the ticker text with a transform](./004-ticker-transform-slide.md)           | HIGH     | TODO   |
| 005 | [Sharpen the mark-as-seen celebration](./005-seen-celebration-polish.md)            | MEDIUM   | TODO   |
| 006 | [Route the remaining motion through the timing tokens](./006-motion-tokens-pass.md) | LOW      | TODO   |

## Execution order

1. **004** — the review's one blocking finding: the ticker's hover slide is a layout property, runs
   for up to three seconds and overshoots on a curve with `y > 1`. Independent, touches only the
   ticker component.
2. **006** — the token pass (adds `--ease-in-out`, folds the FLIP, the nav pill and the three image
   fades onto the shared scale). Independent; do it before or after 004.
3. **005** — the celebration polish. Independent, but read it against the product decision below:
   the particles and the 2.2 s confirmation stay. It also carries the one real bug fix of the three
   open plans: `.seen-success` overrides `--mdc-filled-button-*`, which Material 22 never reads, so
   the confirmation pill has always rendered in the _disabled_ grey instead of primary. Fixing the
   token names (and the `--mat-button-filled-disabled-*` pair the disabled button actually needs) is
   what makes the celebration end on the app's primary colour.

## Dependencies

- No plan shares a file with another. 002 and 003 already share `--ease-out`, which now exists.
- 006 adds `--ease-in-out`; 004 and 005 only need `--ease-out`, so either order works.
- 004 is the only plan that changes behaviour visible to a test browser (`hover` / `pointer` media
  queries); its spec must pass unmodified.

## Deliberate decisions carried over

- **The mark-as-seen particles and the 2.2 s confirmation stay.** Marking seen is frequent, but it is
  the app's one reward moment; 005 polishes it (real primary fill, colour blend, check entrance, no
  button rescale while the request runs) and explicitly forbids removing or staggering the burst.
- **Reduced motion stays a single global rule** (`src/app/shared/styles/manual/reminders.css:61-73`)
  that zeroes every duration. It also zeroes opacity/colour fades, where "gentler, not zero" would
  prefer to keep them; narrowing that rule would have to be audited against Material's own motion and
  is not worth a plan. Plans that apply a value change regardless of duration (004) branch in TS
  instead, because a zero-length transition would still move the element.
- **The favourite star's hover-only appearance** (`show-header.component.scss:54-60`) pops in with no
  motion when the title is hovered. Crossfading it needs the button to hold layout space at all
  times, which risks wrapping long titles, so it is left alone.

## Known opportunities not planned

- **Marking an episode unseen has no confirmation.** `show.component.html:59` calls
  `executeService.removeEpisode` directly, while marking seen goes through
  `addToHistory` → `updateSeenFeedback`. The button just flips back to `Mark as seen` with no
  acknowledgement. This is a product gap rather than a motion one, but it is the obvious next
  celebration-shaped hole.
- **Removed rows teleport.** When a list loses a row (watchlist remove, filter), the remaining rows
  slide up over the FLIP while the removed row disappears in one frame. A FLIP exit needs the
  directive to keep the element in the DOM for the duration — a real change to
  `transition-group.directive.ts`, out of scope for 006.
- **Material's own motion** (dialogs, snackbars, menus, ripples, the sidenav container) is
  library-owned and follows the Material timing tokens; it is not reviewed here.

## Status keys

`TODO` — not started · `IN PROGRESS` · `DONE` — merged and verified · `DROPPED` — deliberately not
pursued (note why).
