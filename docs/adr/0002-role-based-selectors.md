# Role/text-based selectors replace data-test-id attributes

The app previously exposed `data-test-id` attributes for e2e automation, but Material 22 renamed the CSS classes the old tests relied on and the test ids were drifting out of sync with the markup. We remove all `data-test-id` attributes from templates and drive both e2e (Playwright) and unit tests with accessible role/text/label queries instead.

Why: one selector vocabulary across test layers, selectors stay stable across styling/framework churn, and it keeps test hooks out of the production markup.
