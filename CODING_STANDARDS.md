# CODING_STANDARDS.md

> Source of truth for volatile Angular guidance is the `@angular-developer` skill. Load it before writing code. This file only locks repo-specific choices enforceable by config or review.

## 1. Toolchain

- Package manager: `pnpm` (`pnpm ci` for clean install).
- Format: `oxfmt` (printWidth 100, singleQuote, see `.oxfmtrc.json`).
- Lint: `angular-eslint`, `pnpm lint:check` (no fix) / `pnpm lint` (fix).
- CI order: `format:check`, `lint:check`, `test:coverage`, `e2e`.
- Fix-all: `pnpm fix` (format + lint).

## 2. TypeScript

- Strict mode on (`strict`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictTemplates`, `strictInjectionParameters`), see `tsconfig.json`.
- Target `ES2022`, module `preserve`.
- Explicit function return types required (`@typescript-eslint/explicit-function-return-type` in `eslint.config.js`).
- Prefer pure helpers in `src/app/shared/helper/` and RxJS operators in `src/app/shared/operator/`.
- Validate external API responses with Zod via `parseResponse` operator.
- Path aliases only, no deep relative imports:
  - `@constants`, `@helper/*`, `@operator/*`, `@services/*`, `@shared/*`, `@type/*`

## 3. Angular core

- Angular 22, standalone-only. Do NOT set `standalone: true` in decorators.
- Application builder `@angular/build:application`.
- Reactivity: signals + `computed`, `linkedSignal` for linked state, `effect` only for logging / third-party DOM (`afterRenderEffect`).
- Templates: native control flow `@if` / `@for` / `@switch`, never `*ngIf` / `*ngFor` / `*ngSwitch`.
- Components: `input()` / `output()` functions, not decorators.
- DI: `inject()` function, not constructor injection. Respect hierarchical injectors (`providers` vs `viewProviders`).
- Subscriptions: `takeUntilDestroyed()` from `@angular/core/rxjs-interop`.
- Pipes: prefer pipes in templates; outside templates reuse plain formatting functions, do not inject pipes to call `transform()`.

## 4. Naming, selectors, files

- Selector prefix `t`: components `t-*` kebab-case, directives `t*` camelCase (enforced in `eslint.config.js`).
- Follow `angular-developer` naming conventions reference (intent over role) for files, components, services, directives, pipes.
- Single quotes, 2-space indent.
- Feature layout: `src/app/pages/<feature>/routes.ts + data/ (services) + pages/ + ui/ (if needed)`.
- Shared: `src/app/shared/services|components|directives|guards|interceptors|helper|operator|mocks|styles/`.
- Types: `src/types/` (e.g. `Show`, `Episode`, `Trakt`, `Tmdb`, `Stats`).

## 5. State and data

- Local/shared state: `SyncDataService` (signal + localStorage hybrid, `{ s, sync }`).
- Mutations: `ExecuteService` optimistic update then API call.
- Async / HTTP / server state: always TanStack Angular Query (`provideTanStackQuery` in `app.config.ts`). Do not use `resource` / `httpResource`.
- Config: `ConfigService` wraps config sync.
- Sync flow details (gate, bookkeeping, store version, traps): `docs/agents/sync-flow.md`.
- Domain terms: see `GLOSSARY.md` (Show, Season, Episode, Watchlist, History, Favorite, Trakt, TMDB).

## 6. HTTP, routing, forms

- HTTP: `provideHttpClient` + TanStack Angular Query, `api-auth` interceptor adds Trakt OAuth header.
- API endpoints: `src/app/shared/api.ts`. OAuth via `angular-oauth2-oidc`, see `docs/agents/trakt-oauth.md`.
- Routing: lazy `loadComponent`, `defineRoutes` with static/dynamic segments, guards `loggedIn` / `loggedOut`, resolvers via `ResolveFn`, `<router-outlet>` nesting as needed.
- Forms: always Signal Forms.

## 7. Styling and a11y

- Material 3 theme in `src/theme/`, variables/mixins in `src/app/shared/styles/`.
- Component-scoped styles.
- Accessibility lint (`templateAccessibility`) must pass. Use Angular Aria patterns for Accordion, Listbox, Combobox, Menu, Tabs, Toolbar, Tree, Grid.

## 8. Testing

- Unit: Vitest via `@angular/build:unit-test`, `*.spec.ts` alongside source, globals enabled.
- Mocks in `src/app/shared/mocks/`.
- Prefer single-file runs: `pnpm test --include='src/path/to.spec.ts'`.
- Full `pnpm test` / `pnpm e2e` only pre-commit or on explicit request.
- E2E: Playwright, helpers in `e2e/` (`seed.ts`, `fixtures.ts`, `api.ts`, call `blockExternalTraffic` first).
