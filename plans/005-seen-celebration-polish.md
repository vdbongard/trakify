# 005 — Sharpen the mark-as-seen celebration

- **Status**: TODO
- **Commit**: 165b5c25
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens / Physicality
- **Estimated scope**: 1 file, ~30 lines

## Problem

Marking an episode seen plays a small celebration: the button morphs with a scale pop and a ring,
eight particles burst out of it, and the label swaps to `✓ Marked as seen!` for 2.2 seconds
(`src/app/pages/shows/pages/show/show.component.ts:470`). That is deliberate and it stays — the
particles are the point of the moment and are explicitly out of scope for removal.

Three details inside the celebration are off:

```scss
/* src/app/shared/components/episode/base-episode.component.scss:18-32 — current */
.updating-seen-status {
  animation: seen-status-pulse 2200ms ease-in-out infinite;
}

.seen-button-content {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.seen-success {
  --mdc-filled-button-container-color: var(--mat-sys-primary);
  --mdc-filled-button-label-text-color: var(--mat-sys-on-primary);
  animation: seen-success-pop 500ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
```

```scss
/* src/app/shared/components/episode/base-episode.component.scss:110-138 — current */
@keyframes seen-status-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--mat-sys-primary) 22%, transparent);
    transform: scale(1);
  }

  50% {
    box-shadow: 0 0 0 4px transparent;
    transform: scale(1.008);
  }
}

@keyframes seen-success-pop {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--mat-sys-primary) 35%, transparent);
    transform: scale(0.97);
  }

  45% {
    box-shadow: 0 0 0 7px transparent;
    transform: scale(1.05);
  }

  100% {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--mat-sys-primary) 22%, transparent);
    transform: scale(1);
  }
}
```

```scss
/* src/app/shared/components/episode/base-episode.component.scss:34-43 — current */
.seen-check {
  display: inline-grid;
  width: 1.4rem;
  height: 1.4rem;
  place-items: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--mat-sys-on-primary) 20%, transparent);
  font-weight: 700;
  line-height: 1;
}
```

1. **The waiting pulse scales the button itself** (`scale(1.008)`) for the whole request. Scaling a
   filled button resamples its label, so the button text is very slightly soft for as long as the
   pulse runs. The ring is already doing the work; the scale adds nothing.
2. **The success fill never appears at all.** `.tertiary-button` fills the button with
   `--mat-sys-tertiary` (`src/theme/theme-extensions.scss:67-73`). `.seen-success` tries to swap
   that for `--mat-sys-primary`, but both of its overrides name tokens Material 22 does not read.
   The filled button's own stylesheet (`@angular/material/button/_m3-button.scss`, compiled into
   `node_modules/@angular/material/fesm2022/button.mjs`) only ever reads `--mat-button-filled-*`:

   ```css
   /* the only two rules that paint the filled button */
   .mat-mdc-unelevated-button:not(:disabled) {
     color: var(--mat-button-filled-label-text-color, var(--mat-sys-on-primary));
     background-color: var(--mat-button-filled-container-color, var(--mat-sys-primary));
   }
   .mat-mdc-unelevated-button[disabled],
   .mat-mdc-unelevated-button.mat-mdc-button-disabled {
     color: var(
       --mat-button-filled-disabled-label-text-color,
       color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent)
     );
     background-color: var(
       --mat-button-filled-disabled-container-color,
       color-mix(in srgb, var(--mat-sys-on-surface) 12%, transparent)
     );
   }
   ```

   So `--mdc-filled-button-container-color` and `--mdc-filled-button-label-text-color` are dead
   code, and on top of that the button is `[disabled]` for the whole celebration
   (`base-episode.component.html:32`), which leaves only the second rule in play. What the user
   actually sees for the 2.2 s confirmation is a dim grey disabled pill with a grey label — the
   primary fill the code was written for has never rendered. The celebration's largest visual beat
   is missing, not merely cut.

   This is the reason the plan is not only polish: the reward is meant to end on the app's primary
   colour, and today it ends on the disabled colour.

3. **The check mark teleports in.** `base-episode.component.html:37-39` creates `.seen-check` with
   `@if` when the feedback state starts, and it appears fully formed in the middle of a 500 ms pop.
   The one new element of the celebration is the only one with no entrance.

The pop's curve is also a hand-typed near-miss of the app's ease-out token (see "Repo conventions").

## Target

Keep the burst, the ring and the 2.2 s confirmation exactly as they are. Fix the three details inside
them — including making the intended primary fill real, which is the only change here that is a
visible bug fix rather than polish:

```scss
/* target: src/app/shared/components/episode/base-episode.component.scss:18-20 */
// The ring breathes; the button itself does not scale — scaling a filled button resamples its
// label for the whole wait.
.updating-seen-status {
  animation: seen-status-pulse 2200ms ease-in-out infinite;
}
```

```scss
/* target: src/app/shared/components/episode/base-episode.component.scss:28-33 */
.seen-success {
  // The button is `[disabled]` for the whole confirmation (base-episode.component.html:32), so
  // Material only reads the *disabled* filled-button tokens here. The non-disabled pair keeps the
  // intent explicit in case the button ever stops being disabled.
  --mat-button-filled-container-color: var(--mat-sys-primary);
  --mat-button-filled-label-text-color: var(--mat-sys-on-primary);
  --mat-button-filled-disabled-container-color: var(--mat-sys-primary);
  --mat-button-filled-disabled-label-text-color: var(--mat-sys-on-primary);
  // A celebration, not a UI transition: 500ms is deliberate and is held for the whole
  // confirmation, so it is allowed past the 300ms UI budget.
  animation: seen-success-pop 500ms var(--ease-out) both;
  // The fill runs dim grey (disabled, while the request is in flight) → primary in the frame the
  // pop starts. Blend it, so the biggest visual change of the moment is not a hard cut.
  transition:
    background-color 200ms ease,
    color 200ms ease;
}
```

```scss
/* target: src/app/shared/components/episode/base-episode.component.scss:34-50 */
.seen-check {
  display: inline-grid;
  width: 1.4rem;
  height: 1.4rem;
  place-items: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--mat-sys-on-primary) 20%, transparent);
  font-weight: 700;
  line-height: 1;
  // The check is the confirmation: let it land with the burst instead of appearing between
  // frames. Covered by the global reduced-motion rule, which zeroes both durations.
  transition:
    opacity 120ms var(--ease-out),
    transform 200ms var(--ease-out);

  @starting-style {
    opacity: 0;
    transform: scale(0.6);
  }
}
```

```scss
/* target: src/app/shared/components/episode/base-episode.component.scss:110-121 */
@keyframes seen-status-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--mat-sys-primary) 22%, transparent);
  }

  50% {
    box-shadow: 0 0 0 4px transparent;
  }
}
```

Exact motion values:

- Pop: **`500ms`, `cubic-bezier(0.23, 1, 0.32, 1)`** (`var(--ease-out)`), unchanged 0.97 → 1.05 → 1
  scale and unchanged ring end state. The duration is a deliberate celebration and stays at 500 ms.
- Colour blend: **`200ms`, built-in `ease`** on both `background-color` and `color` — a colour
  change, not a movement; `ease` is the right curve for it, and 200 ms is inside the 125–200 ms band.
  The start colour is the disabled grey, because that is what the button shows while the request runs.
- Check entrance: **`opacity 120ms` + `transform 200ms`, `var(--ease-out)`**, from
  `scale(0.6)` + `opacity: 0` — a small pop, never `scale(0)`.
- Waiting pulse: **unchanged `2200ms ease-in-out infinite`**, `box-shadow` only.
- Particles: **unchanged** — `750ms`, `cubic-bezier(0.12, 0.72, 0.22, 1)`, eight particles, `both`.
  They are simultaneous on purpose: a radial burst is one event, not a staggered list entrance.

## Repo conventions to follow

- The `--ease-out` token is `cubic-bezier(0.23, 1, 0.32, 1)` in `src/theme/theme-extensions.scss:16`.
  The existing pop curve `cubic-bezier(0.2, 0.8, 0.2, 1)` is a near-miss of it; use the token so the
  celebration and the accordion (`show-header.component.scss:79`) share one curve.
- `@starting-style` nested inside a class is already used in this repo —
  `src/app/pages/redirect/redirect.component.scss:10-19` is the exemplar:
  ```scss
  .login-loading {
    transition:
      opacity 200ms var(--ease-out),
      transform 200ms var(--ease-out);

    @starting-style {
      opacity: 0;
      transform: scale(0.96);
    }
  }
  ```
- Reduced motion: the global rule at `src/app/shared/styles/manual/reminders.css:61-73` forces every
  transition/animation duration to `0s`; the component's own block at
  `base-episode.component.scss:157-171` additionally removes the pulse/pop and hides the particles.
  Both stay as they are.
- Material 22 exposes the filled button's colours as `--mat-button-filled-*`
  (`--mat-button-filled-container-color`, `--mat-button-filled-label-text-color`,
  `--mat-button-filled-disabled-container-color`, `--mat-button-filled-disabled-label-text-color`,
  `--mat-button-filled-state-layer-color`, `--mat-button-filled-ripple-color`). The
  `--mdc-filled-button-*` prefix is Material 16-era and is not read by anything in this version —
  check `node_modules/@angular/material/fesm2022/button.mjs` (the `.mat-mdc-unelevated-button`
  rules) before assuming a token name. `--mat-button-filled-*` is also what
  `src/theme/theme-extensions.scss:67-73` drives through `mat.button-overrides`, which is why
  `.tertiary-button` works.
- Custom properties are resolved on the element that uses them, and `.seen-success` sits on the
  same `<button>` as `.mat-mdc-unelevated-button`, so declaring the token there is enough. Angular's
  emulated encapsulation adds `[_ngcontent-*]` to `.seen-success` but that only matters between
  competing declarations of the same property — nothing else declares these tokens.
- The component's stylesheet is a plain component SCSS file; no tokens are defined here.

## Steps

1. `src/app/shared/components/episode/base-episode.component.scss` — replace the
   `@keyframes seen-status-pulse` block (lines 110-121) with the shadow-only version above. Keep the
   `.updating-seen-status` rule (lines 18-20) exactly as it is apart from adding the comment.
2. Same file — replace the `.seen-success` rule (lines 28-32) with the target above. This is two
   changes in one rule:
   - rename the two `--mdc-filled-button-*` properties to `--mat-button-filled-*` and add the
     `--mat-button-filled-disabled-*` pair (this is what makes the primary fill render at all);
   - the animation curve becomes `var(--ease-out)` and `transition: background-color 200ms ease,
     color 200ms ease` is added.

   Keep the `both` fill mode.

3. Same file — add the transition and `@starting-style` to `.seen-check` (lines 34-43) as shown,
   leaving every existing declaration untouched.
4. Do not change the particle rules (`.seen-particles`, `.particle`, `.particle-1` … `.particle-8`,
   lines 45-108), the `seen-success-pop` keyframes (lines 123-138), the burst keyframes (lines
   140-155) or the reduced-motion block (lines 157-171).

## Boundaries

- Do NOT remove, shorten, stagger or re-time the particle burst, and do NOT reduce the 2.2 s
  confirmation hold (`show.component.ts:470`). The burst is the intended reward and is a product
  decision, not a defect.
- Do NOT touch `src/app/shared/components/episode/base-episode.component.html` or `.ts` — the
  celebration's structure and timing are already right.
- Do NOT keep the old `--mdc-filled-button-*` names "alongside for safety" — nothing reads them in
  Material 22, and leaving them makes the fix look applied while the button stays grey.
- Do NOT switch the button from `disabled` to `aria-disabled` in this plan. The confirmation spec
  (`base-episode.component.spec.ts:192-204`) asserts `button.disabled === true`, and the disabled
  state is what stops a double-submit during the 2.2 s hold.
- Do NOT change `.tertiary-button` in the theme, or the resting (enabled) fill.
- Do NOT add a `transform` back to the pulse keyframes, and do NOT replace the `box-shadow` with a
  pseudo-element ring in this plan.
- Do NOT add new dependencies.
- If the code you find does not match the excerpts above (drift since commit `165b5c25`), STOP and
  report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm lint:check` → clean.
  - `pnpm format:check` → clean.
  - `pnpm test --include='src/app/shared/components/episode/base-episode.component.spec.ts'` →
    passing. Its confirmation test (`:192-204`) asserts the `seen-success` class, the
    `✓Marked as seen!` label, `disabled` and the `aria-label`; none of them change.
  - `pnpm e2e` → full suite passing.
- **Feel check** (the Show page, `Mark as seen`, at normal speed and in DevTools → Animations at 10%):
  - Click: the button pops and the ring expands, the fill blends from the dim disabled grey to the
    primary colour (the label blending to on-primary with it) instead of staying grey, and the check
    scales up inside the pop instead of appearing fully formed.
  - Compare against the resting button: the resting fill is tertiary, the confirmation fill is
    primary, and both are fully opaque. If the confirmation pill is still a translucent grey, the
    `--mat-button-filled-disabled-container-color` override did not land.
  - The eight particles still burst at once, radially, and the button stays `Marked as seen!` long
    enough to read (about two seconds).
  - While a mark request is in flight, watch the button label at 400% zoom: it must stay sharp — no
    sub-pixel softness from the pulse scaling the button.
  - Mark a second episode after the first has settled: the celebration must replay identically (the
    `@starting-style` only runs on the check's first appearance in each feedback state).
  - DevTools → Rendering → `prefers-reduced-motion: reduce`: no pop, no burst, no check entrance —
    the button lands in its success state immediately with the ring, and the label is readable.
- **Done when**: the confirmation pill actually renders in the primary colour, its fill blends instead
  of cutting, the check arrives with the burst, and the waiting pulse no longer scales the button —
  all while the burst and the 2.2 s hold are untouched.
