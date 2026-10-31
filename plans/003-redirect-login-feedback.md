# 003 — Acknowledge the OAuth return with a spinner

- **Status**: DONE
- **Commit**: c2f60193
- **Severity**: LOW
- **Category**: Missed opportunity (rare, high-emotion moment with no feedback)
- **Estimated scope**: 3 files, ~25 lines

## Problem

Returning from Trakt lands on `/redirect`, which renders the shell — header, nav, empty content — and
then does nothing visible while `tryLoginCodeFlow()` completes and the app navigates on.

```ts
// src/app/pages/redirect/redirect.component.ts:20-34 — current
async ngOnInit(): Promise<void> {
  try {
    await this.oauthService.tryLoginCodeFlow();

    if (this.oauthService.hasValidAccessToken()) {
      this.authService.isLoggedIn.set(true);
      await this.router.navigate(['']);
      // The SyncService subscribes to isLoggedIn and runs the sync itself; calling
      // syncNew() here too would run two full syncs back-to-back.
    } else {
      onError(Error('Something went wrong'), this.snackBar);
    }
  } catch {
    onError(Error('Something went wrong'), this.snackBar);
  }
}
```

```html
<!-- src/app/pages/redirect/redirect.component.html:1 — current (file is empty) -->
```

```scss
/* src/app/pages/redirect/redirect.component.scss:1 — current (file is empty) */
```

This is the one moment in the app that gives no acknowledgement at all, and it is the moment a new
user first sees after signing up: a page frame with a blank middle. It is rare (first run / re-auth),
which is exactly the tier where a small entrance is allowed.

## Target

Render the app's own spinner immediately, and let it enter with a short fade + scale instead of
popping in — `opacity` and `transform` only, no layout.

```html
<!-- target: src/app/pages/redirect/redirect.component.html -->
<div class="login-loading">
  <t-spinner [loadingDelay]="0" />
</div>
```

```scss
/* target: src/app/pages/redirect/redirect.component.scss */
:host {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

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

Exact values: **200 ms**, **`cubic-bezier(0.23, 1, 0.32, 1)`** (`--ease-out`), from
`opacity: 0; transform: scale(0.96)` to `opacity: 1; transform: scale(1)`. `scale(0.96)` — never
`scale(0)`: nothing in the real world appears from nothing.

Notes on why these exact choices:

- `[loadingDelay]="0"` — `SpinnerComponent.loadingDelay` defaults to `800`
  (`src/app/shared/components/spinner/spinner.component.ts:11`), which exists to stop the spinner
  flickering on fast loads. This page has nothing else to show, so there is no flicker to avoid.
- The wrapper is mounted with the page, so its `@starting-style` transition begins as the page paints
  and the spinner (one macrotask later) enters inside that fade. If a given browser lands the spinner
  more than a frame after it, the fade simply starts partly through — the spinner still fades in
  rather than popping. If it pops in fully opaque, stop and report; do not add a delay hack.
- `@starting-style` is the no-JS entry mechanism. Where it is unsupported the page degrades to
  showing the spinner instantly — still a complete fix for the blank page, just without the fade.
- Do NOT add an entry animation to `spinner.component.scss`: that file is used by every loading state
  in the app (tens of times a day), and a fade there would delay the only signal on a slow load. The
  entry belongs to this page, which is why the transition lives in the redirect page's own SCSS.

## Repo conventions to follow

- Page hosts centre their own content in their component SCSS; `src/app/pages/login/login.component.scss:1-5`
  is the pattern:
  ```scss
  :host {
    display: flex;
    justify-content: center;
    padding: 1rem;
  }
  ```
- The spinner is the shared component, imported as `SpinnerComponent` from
  `@shared/components/spinner/spinner.component` and used as `<t-spinner />`
  (`src/app/pages/shows/pages/watchlist/watchlist.component.html:2`).
- `--ease-out` is a theme token added next to `--transition-duration: 250ms` in
  `src/theme/theme-extensions.scss`.
- Standalone component; no `standalone: true` in decorators for new components (this one already has
  it — leave that line alone, it is out of scope).

## Steps

1. **Token check.** Confirm `--ease-out: cubic-bezier(0.23, 1, 0.32, 1);` exists inside the `:root`
   block of `src/theme/theme-extensions.scss` (directly after `--transition-duration: 250ms;` on line
   15). Plan 002 adds it. If it is missing, add exactly that line — do not define a second curve or a
   component-local value.

2. `src/app/pages/redirect/redirect.component.ts`
   - Add `import { SpinnerComponent } from '@shared/components/spinner/spinner.component';` after the
     `AuthService` import (line 5).
   - Add `imports: [SpinnerComponent],` to the `@Component` metadata, between `selector` and
     `templateUrl`.

3. `src/app/pages/redirect/redirect.component.html`
   - Replace the empty file with the target markup above.

4. `src/app/pages/redirect/redirect.component.scss`
   - Replace the empty file with the target styles above.

## Boundaries

- Do NOT modify `src/app/shared/components/spinner/spinner.component.*` — no fade, no new input, no
  style change. The opt-in is `loadingDelay` + a class on this page only.
- Do NOT change `RedirectComponent.ngOnInit` logic, the OAuth flow, the error path or the navigation
  target. This plan adds markup and styles only.
- Do NOT add a minimum display time, a timeout, or a second spinner state: the page is replaced by
  navigation as soon as the flow resolves.
- Do NOT animate anything else on the page (no page-level fade, no `animation` keyframes).
- Do NOT add new dependencies.
- If the code you find does not match the excerpts above (drift since commit `c2f60193`), STOP and
  report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm lint:check` → clean (the component imports list stays sorted/alphabetical as ESLint expects).
  - `pnpm format:check` → clean.
  - `pnpm test --include='src/app/pages/redirect/redirect.component.spec.ts'` → passing. That spec
    creates the component through `TestBed` and asserts the login flow runs; adding the template must
    not require new providers.
  - `pnpm e2e` → full suite passing.
- **Feel check** (run the real OAuth round trip against Trakt, or throttle to Slow 3G and hit
  `/redirect` after a login):
  - The content area is never blank: a centred spinner is visible for the whole wait.
  - In DevTools → Animations panel at 10% playback: the spinner fades and scales up from 0.96 to 1
    over 200 ms, starting fast and settling (ease-out); it must not jump to full size in one frame.
  - It must not flicker: the spinner must not appear, vanish, and reappear while the flow runs.
  - DevTools → Rendering → `prefers-reduced-motion: reduce`: the spinner appears immediately, fully
    opaque, with no movement, and the flow completes normally (the global rule in
    `src/app/shared/styles/manual/reminders.css:61-73` zeroes the durations — the page must still be
    usable, it must not freeze mid-fade).
  - Navigate away and back to `/redirect` (or reload it): the entrance plays each time, and the
    spinner is gone once the Show list has loaded.
- **Done when**: `/redirect` shows a centred spinner from its first paint, it fades/scales in over
  200 ms, and no other spinner in the app gained an entry animation.
