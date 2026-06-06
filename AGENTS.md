# Trakify — Agent Guide

Single-page Angular 22 app for tracking TV shows via Trakt + TMDB APIs.

## Commands

| Command | Action |
|---|---|
| `pnpm start` | Dev server (port 4200) |
| `pnpm build` | Prod build |
| `pnpm test` | Vitest (Playwright chromium) |
| `pnpm test:coverage` | Test with coverage |
| `pnpm lint` | ESLint + fix |
| `pnpm lint:check` | ESLint (no fix) |
| `pnpm format` | oxfmt |
| `pnpm format:check` | oxfmt --check |
| `pnpm fix` | format + lint |
| `pnpm e2e` | Cypress interactive |
| `pnpm cypress:run` | Cypress headless |
| `pnpm watch` | `ng build --watch --configuration development` |

CI pipeline order: `format:check` → `lint:check` → `test:coverage`.

## Toolchain

- **Package manager**: pnpm (`pnpm ci` for clean install)
- **Angular**: 22, standalone-only, application builder (`@angular/build:application`). Do NOT set `standalone: true` in decorators.
- **Test**: Vitest via `@angular/build:unit-test` (not Karma). Global `vitest/globals` available.
- **Format**: oxfmt (printWidth 100, singleQuote, ignore: dist/.angular/.vscode/.github/)
- **Lint**: angular-eslint. Selector prefix `t` (directives: camelCase, components: kebab-case). **Explicit function return types required.** Scoped to `src/**/*.ts` + `src/**/*.html`.

## TypeScript

- Strict mode, `preserve` module, ES2022 target
- Path aliases: `@constants`, `@helper/*`, `@operator/*`, `@services/*`, `@shared/*`, `@type/*`

## Architecture

```
src/
├── main.ts                        # bootstrapApplication(App, appConfig)
├── app/
│   ├── app.ts                     # Shell: header, nav, router-outlet
│   ├── app.routes.ts              # Lazy-loaded routes (loadComponent)
│   ├── app.config.ts              # Providers (router, SW, HTTP, OAuth, Firebase, TanStack Query)
│   ├── pages/                     # Feature pages, each page:
│   │   ├── shows/                 #   routes.ts + data/ (services) + pages/ (sub-pages with ui/)
│   │   ├── lists/                 #   data/ + ui/
│   │   ├── statistics/            #   data/
│   │   └── {about,login,redirect,error}/
│   ├── shared/
│   │   ├── services/              # 10 services (auth, config, sync, execute, dialog, etc.)
│   │   ├── components/            # 15 reusable components
│   │   ├── directives/            # 4 directives
│   │   ├── guards/                # loggedIn, loggedOut
│   │   ├── interceptors/          # api-auth (Trakt OAuth header)
│   │   ├── helper/                # 30+ pure utility functions
│   │   ├── operator/              # 3 RxJS operators
│   │   ├── mocks/                 # Test mocks
│   │   └── styles/                # variables, mixins, remedy.css
│   └── pages/shows/routes.ts      # 8 show sub-routes (progress, upcoming, watchlist, show, season, episode, search, add-show)
├── types/                         # 19 type definition files (Show, Episode, Trakt, Tmdb, Stats, etc.)
└── theme/                         # Material 3 theme (6 files)
```

## State Management

- `SyncDataService` (signal + localStorage hybrid). Returns `{ s: WritableSignal<T>, sync: (options?) => Observable<void> }`.
- `ExecuteService` handles optimistic updates + API calls.
- `ConfigService` wraps config sync.
- TanStack Angular Query for server state (`provideTanStackQuery`).

## Testing Notes

- Vitest + Playwright chromium (browser: `["chromium"]` in angular.json)
- Test files: `*.spec.ts` alongside source
- Mocks in `src/app/shared/mocks/`

## OAuth & APIs

- Trakt OAuth via `angular-oauth2-oidc` (auth code flow, automatic silent refresh)
- API endpoints: `src/app/shared/api.ts`
- Zod schemas validate API responses (used in `parseResponse` operator)

## Key Conventions

- `t` selector prefix (components: `t-*`, directives: `t*`)
- Single quotes, 2-space indent
- Signals + `OnPush` change detection
- `input()` / `output()` functions, not decorators
- `@if` / `@for` / `@switch` native control flow (no `*ngIf` etc.)
- `inject()` for DI, not constructor injection
- `takeUntilDestroyed()` from `@angular/core/rxjs-interop` for subscription cleanup
- Optimistic updates then API call pattern (especially in ExecuteService)

## Domain Language

See `CONTEXT.md` for exact terms (Show, Season, Episode, Watchlist, History, Favorite, Trakt, TMDB, etc.).

## Agent Skills

Issue tracker | GitHub issues (`docs/agents/issue-tracker.md`)
Triage labels | Default canonical vocabulary (`docs/agents/triage-labels.md`)
Domain docs | Single-context layout (`docs/agents/domain.md`)
