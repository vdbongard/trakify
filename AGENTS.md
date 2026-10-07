# Trakify — Agent Guide

Single-page Angular 22 app for tracking TV shows via Trakt + TMDB APIs.

## Commands

| Command              | Action                                         |
| -------------------- | ---------------------------------------------- |
| `pnpm start`         | Dev server (port 4200)                         |
| `pnpm build`         | Prod build                                     |
| `pnpm test`          | Vitest (Playwright chromium)                   |
| `pnpm test:coverage` | Test with coverage                             |
| `pnpm lint`          | ESLint + fix                                   |
| `pnpm lint:check`    | ESLint (no fix)                                |
| `pnpm format`        | oxfmt                                          |
| `pnpm format:check`  | oxfmt --check                                  |
| `pnpm fix`           | format + lint                                  |
| `pnpm watch`         | `ng build --watch --configuration development` |
| `pnpm e2e`           | Playwright e2e                                 |
| `pnpm e2e:ui`        | Playwright e2e in UI mode                      |

CI pipeline: `format:check`, `lint:check`, `test:coverage`, `e2e`.

Deploy branch is `main` (Firebase Hosting on merge).

## Git

- Always use Conventional Commits: `type(scope): description` (e.g. `fix(episode): calm seen button pulse`).
- `style` is only for formatting with no code meaning change (white-space, formatting, semi-colons). Never use it for UI/CSS visual changes — use `fix(scope)` for visual polish/bugs, `feat(scope)` for new UI.
- Always commit afterwards: after completing a task, stage and commit the changes without asking.

## Toolchain

- **Package manager**: pnpm (`pnpm ci` for clean install)
- **Angular**: 22, standalone-only, application builder (`@angular/build:application`). Do NOT set `standalone: true` in decorators.
- **Test**: Vitest via `@angular/build:unit-test` (not Karma). Global `vitest/globals` available.
- **Format**: oxfmt (printWidth 100, singleQuote, ignore: dist/.angular/.vscode/.github/)
- **Lint**: angular-eslint. Selector prefix `t` (directives: camelCase, components: kebab-case). **Explicit function return types required.** Applied to `*.ts` + `*.html`; `naming-convention`: add each violating field name individually.

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
│   │   ├── shows/                 #   routes.ts + data/ (services) + pages/: show, season, episode, search, upcoming, watchlist, shows-progress (route: progress), shows-with-search (routes: shows, add-show)
│   │   ├── lists/                 #   data/ + ui/
│   │   ├── statistics/            #   data/
│   │   └── {about,login,redirect,error}/
│   └── shared/
│       ├── services/              # 10 services (auth, config, sync, execute, dialog, etc.)
│       ├── components/            # 15 reusable components
│       ├── directives/            # 4 directives
│       ├── guards/                # loggedIn, loggedOut
│       ├── interceptors/          # api-auth (Trakt OAuth header)
│       ├── helper/                # 30+ pure utility functions
│       ├── operator/              # 4 RxJS operators
│       ├── mocks/                 # Test mocks
│       └── styles/                # variables, mixins, remedy.css
├── types/                         # 19 type definition files (Show, Episode, Trakt, Tmdb, Stats, etc.)
└── theme/                         # Material 3 theme (6 files)
```

## State Management

- `SyncDataService` (signal + localStorage hybrid). Returns `{ s: WritableSignal<T>, sync: (options?) => Observable<void> }`.
- `ExecuteService` handles optimistic updates + API calls.
- `ConfigService` wraps config sync.
- TanStack Angular Query for server state (`provideTanStackQuery`).
- Sync flow (gate, bookkeeping, store version, traps): see `docs/agents/sync-flow.md`.

## Testing Notes

- Vitest + Playwright chromium (browser: `["chromium"]` in angular.json)
- Test files: `*.spec.ts` alongside source
- Mocks in `src/app/shared/mocks/`
- Prefer single-file runs: `pnpm test --include='src/path/to.spec.ts'`, `pnpm e2e e2e/name.spec.ts`. Full `pnpm test` / `pnpm e2e` only pre-commit or on explicit request.
- `e2e/` helpers: `seed.ts` (localStorage + OAuth token seeding), `fixtures.ts` (Trakt/TMDB fixture builders), `api.ts` (route interception, `blockExternalTraffic` first).

## OAuth & APIs

- Trakt OAuth via `angular-oauth2-oidc` (auth code flow, custom refresh timer). See `docs/agents/trakt-oauth.md`.
- API endpoints: `src/app/shared/api.ts`
- Zod schemas validate API responses (used in `parseResponse` operator)

## Key Conventions

- `t` selector prefix (components: `t-*`, directives: `t*`)
- Single quotes, 2-space indent
- Signals
- `input()` / `output()` functions, not decorators
- `@if` / `@for` / `@switch` native control flow (no `*ngIf` etc.)
- `inject()` for DI, not constructor injection
- `takeUntilDestroyed()` from `@angular/core/rxjs-interop` for subscription cleanup
- Optimistic updates then API call pattern (especially in ExecuteService)

## Domain Language

See `GLOSSARY.md` for exact terms (Show, Season, Episode, Watchlist, History, Favorite, Trakt, TMDB, etc.).

## Agent Skills

Issue tracker | GitHub issues (`docs/agents/issue-tracker.md`)
Triage labels | Default canonical vocabulary (`docs/agents/triage-labels.md`)
Domain docs | Single-context layout (`docs/agents/domain.md`)
