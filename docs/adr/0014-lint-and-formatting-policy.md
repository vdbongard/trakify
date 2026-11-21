# Lint and formatting policy

The ESLint configuration encodes a few choices that are not obvious from the rule names alone.

## TypeScript rules

- `@typescript-eslint/explicit-function-return-type` is an error. Explicit return types keep the
  public surface readable and stop inference from leaking implementation types.
- `@typescript-eslint/ban-ts-comment` is off, because some external libraries are not typed and
  suppression is currently the escape hatch. This is a concession, not a preference; suppressions
  are tracked for removal (see the typing issue).
- `@typescript-eslint/no-empty-function` is off. Tests override functionality with empty functions.
- `@typescript-eslint/no-useless-constructor` is an error. A useless constructor can be removed
  without changing behaviour.

## Naming

- Selectors use the `t` prefix: `t-*` for components, `t*` for directives.
- `naming-convention` allows `PascalCase` for custom objects and `UPPER_CASE` for constants;
  `camelCase` is the default for variables.
- The long allowlist of snake_case names exists because Trakt and TMDB payload fields keep their API
  spelling. Adding a new API field means adding it to that list, not renaming the field.

## Comments

Comments are banned by a local `no-comments/no-comments` rule, defined in
`eslint-rules/no-comments.js`. The only exceptions are machine
directives (`eslint-disable*`, `@ts-expect-error`, `@ts-check`, `oxfmt-ignore`, IDE inspections),
which the toolchain consumes. Rationale that used to live in comments belongs in `docs/adr/`.
Vendored CSS under `src/app/shared/styles/manual/` keeps its upstream `@docs` metadata and is not
linted.
