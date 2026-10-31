# Animation plans

Three plans from the animation opportunity sweep (commit stamp `c2f60193`). Each is self-contained:
exact file paths, current code, target values, steps, boundaries and a feel check. They are written
for an executor with no context from the audit.

| #   | Plan                                                                             | Severity | Status |
| --- | -------------------------------------------------------------------------------- | -------- | ------ |
| 001 | [Press feedback on the two primary list rows](./001-press-feedback-list-rows.md) | MEDIUM   | DONE   |
| 002 | [Animate the Show overview expand/collapse](./002-overview-expand-collapse.md)   | MEDIUM   | TODO   |
| 003 | [Acknowledge the OAuth return with a spinner](./003-redirect-login-feedback.md)  | LOW      | TODO   |

## Execution order

1. **001** — independent, smallest diff, touches the gesture the app sees most. Nothing else waits on
   it.
2. **002** — adds the `--ease-out` token to `src/theme/theme-extensions.scss` and is the largest of the
   three (measure → clamp → animate → clear on `transitionend`).
3. **003** — depends on 002 for `--ease-out`; if it is executed first, its step 1 says to add the
   token (same exact line, same place).

## Dependencies

- 003 → 002: shares the `--ease-out` token. No other plan depends on another; none of them touch the
  same file as another (001: show list wrapper + History; 002: Show header + theme tokens; 003:
  redirect page).

## Conventions used by every plan

- Motion values are copied from `.agents/skills/improve-animations/AUDIT.md`, never approximated:
  `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`; press feedback via Material's ripple (enter 225 ms /
  exit 150 ms); entry transitions 200 ms; accordions 250 ms.
- Reduced motion is handled once, globally, in `src/app/shared/styles/manual/reminders.css:61-73`
  (all transition durations forced to `0s`). Plans must not add per-component reduced-motion media
  queries — but any plan that relies on `transitionend` must branch on
  `prefers-reduced-motion` in JS, because a zero-length transition fires no event.
- One plan per finding; every plan carries the feel check it needs (slow motion, real device) because
  motion can be mechanically correct and still feel wrong.

## Status keys

`TODO` — not started · `IN PROGRESS` · `DONE` — merged and verified · `DROPPED` — deliberately not
pursued (note why).
