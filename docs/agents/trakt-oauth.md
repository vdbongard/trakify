# Trakt OAuth

Auth code flow via `angular-oauth2-oidc` (`oidc: false`, `responseType: 'code'`). See `src/app/shared/auth-config.ts`.

- No `setupAutomaticSilentRefresh`. `AuthService` arms its own one-shot `setTimeout`, 5 min before expiry.
- Refresh is a manual `POST` to `tokenEndpoint` as `x-www-form-urlencoded`: `grant_type=refresh_token`, `refresh_token`, `client_id`, `redirect_uri`. See `refreshToken()` in `src/app/shared/services/auth.service.ts`.
- `loggedIn` guard checks presence of `access_token` in `localStorage`, not validity.
