# Playwright replaces Cypress for e2e tests

The legacy Cypress e2e suite had drifted unusably stale (hash-route assertions against the current path router, `?sync=0` no longer honored, Material-22 CSS selectors, removed empty-state copy) and its dependency was already dropped from the repo. We migrate to Playwright as the e2e framework and run the suite in GitHub Actions. E2E tests use deterministic network interception (`page.route`) with hand-crafted fixtures instead of a live Trakt/TMDB account, because a real-account, live-API suite could not stay green in CI and required account secrets.

Why Playwright: the browser is already installed for Vitest unit tests, the runner provides parallel workers, retries, trace/HTML reports, and CI sharding out of the box, and Playwright selectors are the house style for the new tests.
